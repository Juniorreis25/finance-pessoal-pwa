'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Transaction = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    installment_number: number | null
    total_installments: number | null
    cards: {
        name: string
    } | null
}

interface ExportMenuProps {
    transactions: Transaction[]
    currentDate: Date
}

export function ExportMenu({ transactions, currentDate }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    const monthYear = format(currentDate, 'MMMM_yyyy', { locale: ptBR })
    const monthYearDisplay = format(currentDate, 'MMMM yyyy', { locale: ptBR })

    const prepareData = () => {
        return transactions.map(tx => ({
            Data: format(parseISO(tx.date), 'dd/MM/yyyy'),
            Descrição: tx.description,
            Categoria: tx.category,
            Valor: tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            Tipo: tx.type === 'income' ? 'Entrada' : 'Saída',
            Parcelas: tx.total_installments ? `${tx.installment_number}/${tx.total_installments}` : '-',
            Cartão: tx.cards?.name || 'Dinheiro/Débito',
            rawAmount: tx.amount,
            rawType: tx.type,
            rawCategory: tx.category,
            rawCard: tx.cards?.name || 'Dinheiro/Débito'
        }))
    }

    const exportCSV = () => {
        const fullData = prepareData()
        const exportData = fullData.map(({ Data, Descrição, Categoria, Tipo, Parcelas, Cartão, rawAmount }) => ({
            Data,
            Descrição,
            Categoria,
            Valor: rawAmount,
            Tipo,
            Parcelas,
            Cartão,
        }))
        const csv = Papa.unparse(exportData)
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `transacoes_${monthYear}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setIsOpen(false)
    }

    const exportExcel = () => {
        const fullData = prepareData()
        const exportData = fullData.map(({ Data, Descrição, Categoria, Tipo, Parcelas, Cartão, rawAmount }) => ({
            Data,
            Descrição,
            Categoria,
            Valor: rawAmount,
            Tipo,
            Parcelas,
            Cartão,
        }))
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações')
        XLSX.writeFile(workbook, `transacoes_${monthYear}.xlsx`)
        setIsOpen(false)
    }

    const exportPDF = async () => {
        const doc = new jsPDF()
        const fullData = prepareData()
        const totalIncome = fullData.filter(d => d.rawType === 'income').reduce((acc, d) => acc + d.rawAmount, 0)
        const totalExpense = fullData.filter(d => d.rawType === 'expense').reduce((acc, d) => acc + d.rawAmount, 0)
        const balance = totalIncome - totalExpense

        // --- Cabeçalho com Identidade Visual ---
        // 1. Fundo do Cabeçalho
        doc.setFillColor(20, 28, 36)
        doc.rect(0, 0, 210, 40, 'F')

        // 2. Logo (Canto Superior Direito)
        try {
            // Aumentando o tamanho e ajustando a posição para melhor visibilidade
            // X: 145, Y: 8, Largura: 52, Altura: 18 (proporção melhorada)
            doc.addImage('/logo_nova.png', 'PNG', 145, 8, 52, 18)
        } catch (e) {
            console.warn('Não foi possível carregar a logo no PDF', e)
        }

        // 3. Título e Período
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('Relatório Financeiro', 14, 20)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 240, 255) // Brand Accent
        doc.text(monthYearDisplay.toUpperCase(), 14, 28)

        // 4. Saldo Rápido (Top Right Info)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.text(`Saldo do Período: ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 150, 28)

        // --- Tabela Principal de Transações ---
        doc.setTextColor(20, 28, 36)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Detalhamento de Lançamentos', 14, 52)

        autoTable(doc, {
            startY: 58,
            head: [['Data', 'Descrição', 'Categoria', 'Valor', 'Parc.', 'Cartão']],
            body: fullData.map(d => [d.Data, d.Descrição, d.Categoria, d.Valor, d.Parcelas, d.Cartão]),
            headStyles: {
                fillColor: [20, 28, 36],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 40, bottom: 30 },
            theme: 'striped',
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 3) {
                    const rawType = fullData[data.row.index].rawType
                    if (rawType === 'income') {
                        data.cell.styles.textColor = [0, 180, 100]
                    }
                }
            }
        })

        // --- Visão Executiva (Resumos) ---
        // Pegar a posição Y após a tabela principal
        let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20

        // Se estiver muito embaixo, começar em nova página
        if (currentY > 220) {
            doc.addPage()
            currentY = 25
        }

        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 28, 36)
        doc.text('Resumo Executivo', 14, currentY)

        // Separador sutil
        doc.setDrawColor(0, 240, 255)
        doc.setLineWidth(1)
        doc.line(14, currentY + 2, 35, currentY + 2)

        // Cálculos de Resumo
        const summaryByCategory = fullData.reduce<Record<string, number>>((acc, d) => {
            if (d.rawType === 'expense') {
                acc[d.rawCategory] = (acc[d.rawCategory] || 0) + d.rawAmount
            }
            return acc
        }, {})

        const summaryByCard = fullData.reduce<Record<string, number>>((acc, d) => {
            if (d.rawType === 'expense') {
                acc[d.rawCard] = (acc[d.rawCard] || 0) + d.rawAmount
            }
            return acc
        }, {})

        // Tabela de Resumo por Categoria
        autoTable(doc, {
            startY: currentY + 10,
            head: [['Gasto por Categoria', 'Total']],
            body: Object.entries(summaryByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => [cat, total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]),
            headStyles: { fillColor: [20, 28, 36], textColor: [255, 255, 255], fontSize: 9 },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
            tableWidth: 85,
            margin: { left: 14 },
            theme: 'grid'
        })

        // Tabela de Resumo por Cartão (posicionada ao lado ou abaixo dependendo do espaço)
        const summaryCategoryY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

        autoTable(doc, {
            startY: currentY + 10,
            head: [['Gasto por Método', 'Total']],
            body: Object.entries(summaryByCard)
                .sort((a, b) => b[1] - a[1])
                .map(([card, total]) => [card, total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]),
            headStyles: { fillColor: [20, 28, 36], textColor: [255, 255, 255], fontSize: 9 },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
            tableWidth: 85,
            margin: { left: 110 },
            theme: 'grid'
        })

        const finalSectionY = Math.max(summaryCategoryY, (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 20

        // --- Totais Finais (Rodapé da análise) ---
        if (finalSectionY > 260) {
            doc.addPage()
            currentY = 30
        } else {
            currentY = finalSectionY
        }

        // Box de Totais (Estilo Executivo)
        doc.setFillColor(248, 250, 252)
        doc.rect(110, currentY - 10, 85, 40, 'F')
        doc.setDrawColor(226, 232, 240)
        doc.rect(110, currentY - 10, 85, 40, 'D')

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text('Total de Entradas:', 115, currentY)
        doc.setTextColor(0, 150, 80)
        doc.text(totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 190, currentY, { align: 'right' })

        doc.setTextColor(100, 100, 100)
        doc.text('Total de Saídas:', 115, currentY + 8)
        doc.setTextColor(220, 38, 38)
        doc.text(totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 190, currentY + 8, { align: 'right' })

        doc.setDrawColor(200, 200, 200)
        doc.line(115, currentY + 12, 190, currentY + 12)

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 28, 36)
        doc.text('SALDO FINAL:', 115, currentY + 20)
        doc.text(balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 190, currentY + 20, { align: 'right' })

        // Adicionar número de página em todos os rodapés
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' })
            doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 290)
        }

        doc.save(`Relatorio_Financeiro_${monthYear}.pdf`)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-[52px] h-[52px] bg-brand-deep-sea border border-white/5 rounded-2xl text-slate-300 hover:text-white hover:border-brand-accent/50 transition-all shadow-xl group cursor-pointer"
                title="Exportar Transações"
            >
                <Download className="w-5 h-5 text-brand-accent group-hover:scale-110 transition-transform" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-brand-deep-sea border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                        <button
                            onClick={exportCSV}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-brand-accent transition-colors text-left cursor-pointer"
                        >
                            <FileText className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={exportExcel}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-brand-accent transition-colors text-left cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel (XLSX)
                        </button>
                        <button
                            onClick={exportPDF}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-brand-accent transition-colors text-left cursor-pointer"
                        >
                            <FileJson className="w-4 h-4" />
                            PDF Executivo
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
