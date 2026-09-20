import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";

const ToastContext = createContext();

function getToastType(message) {
    const text = String(message).toLowerCase();

    // SUCCESS
    if (
        text.includes("successful") ||
        text.includes("successfully") ||
        text.includes("added successfully") ||
        text.includes("updated successfully") ||
        text.includes("deleted successfully") ||
        text.includes("saved successfully") ||
        text.includes("created successfully") ||
        text.includes("login successful") ||
        text.includes("logged in successfully") ||
        text.includes("distribution successful")
    ) {
        return "success";
    }

    // ERROR
    if (
        text.includes("failed") ||
        text.includes("error") ||
        text.includes("server error") ||
        text.includes("unable to") ||
        text.includes("invalid") ||
        text.includes("incorrect") ||
        text.includes("not found") ||
        text.includes("login failed") ||
        text.includes("duplicate") ||
        text.includes("required")
    ) {
        return "error";
    }

    // WARNING
    if (
        text.includes("warning") ||
        text.includes("insufficient") ||
        text.includes("out of stock") ||
        text.includes("already exists") ||
        text.includes("already distributed") ||
        text.includes("cannot") ||
        text.includes("can't") ||
        text.includes("not available")
    ) {
        return "warning";
    }

    return "info";
}


/*
 * Format distribution messages
 * into separate lines.
 */
function formatMessage(message) {
    const text = String(message);

    if (
        text.includes("Distribution successful.") &&
        text.includes("Item:") &&
        text.includes("Quantity:") &&
        text.includes("Price:") &&
        text.includes("Total Charge:")
    ) {
        const match = text.match(
            /Distribution successful\.\s*Item:\s*(.*?)\s*Quantity:\s*(.*?)\s*Price:\s*(.*?)\s*Total Charge:\s*(.*)/i
        );

        if (match) {
            return {
                isDistribution: true,
                lines: [
                    {
                        label: "Distribution",
                        value: "Successful"
                    },
                    {
                        label: "Item",
                        value: match[1]
                    },
                    {
                        label: "Quantity",
                        value: match[2]
                    },
                    {
                        label: "Price",
                        value: match[3]
                    },
                    {
                        label: "Total Charge",
                        value: match[4]
                    }
                ]
            };
        }
    }

    return {
        isDistribution: false,
        lines: [
            {
                label: "",
                value: text
            }
        ]
    };
}


export function ToastProvider({ children }) {

    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {

        setToasts((current) =>
            current.filter((toast) => toast.id !== id)
        );

    }, []);


    const showToast = useCallback(
        (message, type) => {

            const id = Date.now() + Math.random();

            const finalType =
                type || getToastType(message);

            const formatted =
                formatMessage(message);

            setToasts((current) => [
                ...current,
                {
                    id,
                    message: String(message),
                    type: finalType,
                    formatted
                }
            ]);

            setTimeout(() => {
                removeToast(id);
            }, 3500);

        },
        [removeToast]
    );


    useEffect(() => {

        const originalAlert = window.alert;

        window.alert = (message) => {

            showToast(
                String(message),
                getToastType(message)
            );

        };

        return () => {
            window.alert = originalAlert;
        };

    }, [showToast]);


    return (

        <ToastContext.Provider value={{ showToast }}>

            {children}

            <div className="toast-container">

                {toasts.map((toast) => (

                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                    >

                        <div className="toast-icon">

                            {toast.type === "success" && "✓"}

                            {toast.type === "error" && "!"}

                            {toast.type === "warning" && "⚠"}

                            {toast.type === "info" && "i"}

                        </div>


                        <div className="toast-message">

                            {toast.formatted.isDistribution ? (

                                <div className="toast-distribution">

                                    {toast.formatted.lines.map(
                                        (line, index) => (

                                            <div
                                                className={`toast-line ${
                                                    index === 0
                                                        ? "toast-line-title"
                                                        : ""
                                                }`}
                                                key={index}
                                            >

                                                {line.label && (
                                                    <span className="toast-label">
                                                        {line.label}:
                                                    </span>
                                                )}

                                                <span className="toast-value">
                                                    {line.value}
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            ) : (

                                <div className="toast-normal-message">
                                    {toast.message}
                                </div>

                            )}

                        </div>


                        <button
                            className="toast-close"
                            onClick={() =>
                                removeToast(toast.id)
                            }
                        >
                            ×
                        </button>

                    </div>

                ))}

            </div>

        </ToastContext.Provider>
    );
}


export function useToast() {
    return useContext(ToastContext);
}