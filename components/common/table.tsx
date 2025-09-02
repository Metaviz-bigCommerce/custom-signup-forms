type Column = {
    key: string,
    label: string
}

type TableProps = {
    columns: Column[],
    data: Record<string, any>[];
    actions?: (row: Record<string,any>) => React.ReactNode;
}

export default function Table ({columns, data, actions}: TableProps) {
    return (
        <table>
            <thead>
                <tr>
                    {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.id}>
                        {columns.map((column) => (
                            <>
                                <td key={column.key}>{row[column.key]}</td>
                                {!!actions ? (
                                    <td className="px-4 py-2">{actions(row)}</td>
                                ) : null}
                            </>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
} 