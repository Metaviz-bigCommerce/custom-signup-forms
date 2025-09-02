'use client'
import { useState } from "react";
import { DropdownItem } from "../../components/common/types";
import DropdownWithMenuIcon from "../../components/common/dropdownWithMenuIcon";
import { Tabs } from "@/components/common/tabs";
import Table from "@/components/common/table";

interface FormField {
    id: number,
    name: string,
    data: string,
    lastModified: string,
    type: string
}

interface Column {
    key: string,
    label: string,
}

const initialFormFields: FormField[] = [
    {
        id: 1,
        name: 'File Upload',
        data: 'fileUpload',
        lastModified: '',
        type: 'custom'
    }
]

const columns: Column[] = [
    {
        key: 'name',
        label: 'Name'
    },
    {
        key: 'data',
        label: 'Data'
    },
    {
        key: 'lastModified',
        label: 'Last Modified'
    },
    {
        key: 'type',
        label: 'Type'
    },
    {
        key: 'actions',
        label: 'Actions'
    }
]

const actions: DropdownItem[] = [
    {
        id: 1,
        name: 'Hide'
    },
    {
        id: 2,
        name: 'Show'
    },
    {
        id: 3,
        name: 'Edit'
    },
    {
        id: 4,
        name: 'Delete'
    },
]

const formFieldTypes: DropdownItem[] = [
    {
        id: 1,
        name: 'File Upload'
    },
    {
        id: 2,
        name: 'Text'
    },
    {
        id: 3,
        name: 'CheckBox'
    }
]

export default function formFieldsSelection () {
    const [formFields, setFormFields] = useState<FormField[]>(initialFormFields);

    const tabs = [
        {
            id: 1,
            label: 'General Fields',
            content: (
                <table>
                    <thead>
                        <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {formFields.map((formField) => (
                            <tr key={formField.id}>
                                <td>{formField.name}</td>
                                <td>{formField.data}</td>
                                <td>{formField.lastModified || 'N/A'}</td>
                                <td>{formField.type}</td>
                                <td className="relative">
                                    <DropdownWithMenuIcon dropdownItems={actions} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        },
        {
            id: 2,
            label: 'Custom Fields',
            content: (
                <Table columns={columns} data={formFields} actions={(row) => <DropdownWithMenuIcon dropdownItems={actions}/>} />
            )
        }
    ]

    return (
        <div>
            <DropdownWithMenuIcon dropdownItems={formFieldTypes} />
            <Tabs tabs={tabs} defaultTab={1} onTabChange={(tabId) => console.log("Active tab:", tabId)} />
        </div>
    )
}