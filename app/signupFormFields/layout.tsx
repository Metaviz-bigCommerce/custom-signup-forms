export default function layout ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <div>
            <h2>Form Fields Selection</h2>
            <p>Choose the fields you want to show on your Signup Form</p>
            {children}
        </div>
    )
}