'use client'
import { useEffect, useState } from "react";
import { DropdownItem } from "../../../components/common/types";
import DropdownWithMenuIcon from "../../../components/common/dropdownWithMenuIcon";
import { Tabs } from "@/components/common/tabs";
import Table from "@/components/common/table";

interface FormFieldType {
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

const initialFormFields: FormFieldType[] = [
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
    },
    {
        id: 4,
        name: 'Radio'
    },
    {
        id: 5,
        name: 'Select'
    },
    {
        id: 6,
        name: 'TextArea'
    },
    {
        id: 7,
        name: 'Date'
    },
    {
        id: 8,
        name: 'Time'
    },
    {
        id: 9,
        name: 'Email'
    },
]

export default function FormFieldsSelection () {
    const [formFields] = useState<FormFieldType[]>(initialFormFields);

    const tabs = [
        {
            id: 1,
            label: 'General Fields',
            content: (
                <Table columns={columns} data={formFields} actions={() => <DropdownWithMenuIcon dropdownItems={actions}/>} />
            )
        },
        {
            id: 2,
            label: 'Address Fields',
            content: (
                <Table columns={columns} data={formFields} actions={() => <DropdownWithMenuIcon dropdownItems={actions}/>} />
            )
        }
    ]

    // async function addSignupFormScript() {
    //     try {
    //         const res = await fetch("/api/bc-scripts", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({
    //                 name: "Bootstrap",
    //                 description: "Build responsive websites",
    //                 src: "https://bigcommerce-custom-signup-app.vercel.app/custom-signup.min.js",
    //                 auto_uninstall: true,
    //                 load_method: "default",
    //                 location: "footer",
    //                 visibility: "all_pages",
    //                 kind: "src",
    //                 consent_category: "essential"
    //             }),
    //         });

    //         const data = await res.json();
    //         console.log(data);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    useEffect(() => {
        // addSignupFormScript();
    }, [formFields])

    return (
        <div>
            <DropdownWithMenuIcon dropdownItems={formFieldTypes} />
            <Tabs tabs={tabs} defaultTab={1} onTabChange={(tabId) => console.log("Active tab:", tabId)} />
        </div>
    )
}