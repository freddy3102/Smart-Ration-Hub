import React from "react";

function AuditTable({ auditData, returnStock }) {

    return (

        <table className="audit-table">

            <thead>

                <tr>

                    <th>ID</th>
                    <th>Beneficiary</th>
                    <th>Item</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Entitled</th>
                    <th>Claimed</th>
                    <th>Unclaimed</th>
                    <th>Returned</th>
                    <th>Status</th>
                    <th>Action</th>

                </tr>

            </thead>

            <tbody>

                {auditData.length === 0 ? (

                    <tr>

                        <td colSpan="11">

                            No audit records found.

                        </td>

                    </tr>

                ) : (

                    auditData.map((record) => (

                        <tr key={record.audit_id}>

                            <td>{record.audit_id}</td>

                            <td>{record.full_name}</td>

                            <td>{record.item_name}</td>

                            <td>{record.month}</td>

                            <td>{record.year}</td>

                            <td>{record.entitled_quantity}</td>

                            <td>{record.claimed_quantity}</td>

                            <td>{record.unclaimed_quantity}</td>

                            <td>{record.warehouse_returned_quantity}</td>

                            <td>

                                {record.audit_status === "Returned" ? (

                                    <span className="returned">

                                        Returned

                                    </span>

                                ) : (

                                    <span className="pending">

                                        Pending

                                    </span>

                                )}

                            </td>

                            <td>

                                {record.audit_status === "Pending" ? (

                                    <button

                                        className="return-btn"

                                        onClick={() =>
                                            returnStock(
                                                record.audit_id,
                                                record.unclaimed_quantity
                                            )
                                        }

                                    >

                                        Return Stock

                                    </button>

                                ) : (

                                    <span>✔</span>

                                )}

                            </td>

                        </tr>

                    ))

                )}

            </tbody>

        </table>

    );

}

export default AuditTable;