type FormPageHeaderProps = {
    title: string
    description: string
}

export function FormPageHeader({ title, description }: FormPageHeaderProps) {
    return (
        <header className="mb-5 sm:mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-brand-gray">{description}</p>
        </header>
    )
}
