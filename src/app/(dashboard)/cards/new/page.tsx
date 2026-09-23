'use client'

import { CardForm } from '@/components/forms/AddCardForm'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

export default function NewCardPage() {
    return (
        <div className="mx-auto max-w-2xl py-1 sm:py-6">
            <FormPageHeader title="Novo cartão" description="Cadastre o limite e as datas do cartão." />

            <CardForm />
        </div>
    )
}
