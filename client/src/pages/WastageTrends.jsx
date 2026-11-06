
import { useEffect, useMemo, useState } from "react";
import { getAllMedicines } from "../services/medicineService";

function WastageTrends() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        setMedicines(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthLabel = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysLeft = (expiryDate) => {
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  // EXPIRY ANALYTICS
  const expiryStats = useMemo(() => {
    const stats = {
      total: medicines.length,
      expired: 0,
      expiring7: 0,
      expiring15: 0,
      expiring30: 0,
      safe: 0,
      totalStock: 0,
      expiredStock: 0,
    };

    medicines.forEach((medicine) => {
      const days = getDaysLeft(medicine.expiryDate);
      const quantity = Number(medicine.quantity) || 0;

      stats.totalStock += quantity;

      if (days < 0) {
        stats.expired++;
        stats.expiredStock += quantity;
      } else if (days <= 7) {
        stats.expiring7++;
      } else if (days <= 15) {
        stats.expiring15++;
      } else if (days <= 30) {
        stats.expiring30++;
      } else {
        stats.safe++;
      }
    });

    return stats;
  }, [medicines]);

  // SIX-MONTH EXPIRY FORECAST
  const expiryForecast = useMemo(() => {
    const months = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const nextMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1
      );

      const count = medicines.filter((medicine) => {
        const expiry = new Date(medicine.expiryDate);
        return expiry >= date && expiry < nextMonth;
      }).length;

      months.push({
        label: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        count,
      });
    }

    return months;
  }, [medicines]);

  // INVENTORY BREAKDOWN
  const inventoryBreakdown = useMemo(() => {
    const categories = [
      { label: "Expired", color: "#dc5555" },
      { label: "Within 7 days", color: "#e68b46" },
      { label: "Within 15 days", color: "#e5b84e" },
      { label: "Within 30 days", color: "#76a9d6" },
      { label: "Safe", color: "#58a67c" },
    ];

    return categories.map((category) => {
      const count = medicines.filter((medicine) => {
        const days = getDaysLeft(medicine.expiryDate);

        if (category.label === "Expired") return days < 0;
        if (category.label === "Within 7 days") return days >= 0 && days <= 7;
        if (category.label === "Within 15 days") return days > 7 && days <= 15;
        if (category.label === "Within 30 days") return days > 15 && days <= 30;
        return days > 30;
      }).length;

      return { ...category, count };
    });
  }, [medicines]);

  // MEDICINES AT RISK
  const riskMedicines = useMemo(() => {
    return medicines
      .filter((medicine) => getDaysLeft(medicine.expiryDate) <= 30)
      .sort(
        (a, b) =>
          getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate)
      );
  }, [medicines]);

  // PURCHASE TRANSACTIONS
  const purchaseTransactions = useMemo(() => {
    const transactions = [];

    medicines.forEach((medicine) => {
      const initialAmount = Number(medicine.initialPurchaseAmount) || 0;

      transactions.push({
        medicineId: medicine._id,
        medicineName: medicine.medicineName,
        type: "Initial Purchase",
        date: medicine.purchaseDate,
        amount: initialAmount,
        quantity: Number(medicine.quantity) || 0,
        recorded: medicine.initialPurchaseAmount !== undefined &&
          medicine.initialPurchaseAmount !== null,
      });

      (medicine.refillHistory || []).forEach((refill) => {
        transactions.push({
          medicineId: medicine._id,
          medicineName: medicine.medicineName,
          type: "Refill",
          date: refill.refillDate,
          amount: Number(refill.amountPaid) || 0,
          quantity: Number(refill.quantityAdded) || 0,
          recorded: refill.amountPaid !== undefined &&
            refill.amountPaid !== null,
        });
      });
    });

    return transactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [medicines]);

  // EXPENSE ANALYTICS
  const expenseStats = useMemo(() => {
    const total = purchaseTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const currentMonth = purchaseTransactions
      .filter(
        (transaction) =>
          transaction.date &&
          getMonthKey(transaction.date) === getMonthKey(new Date())
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const recordedTransactions = purchaseTransactions.filter(
      (transaction) => transaction.recorded
    );

    const average = recordedTransactions.length
      ? total / recordedTransactions.length
      : 0;

    return {
      total,
      currentMonth,
      transactions: purchaseTransactions.length,
      average,
      recordedTransactions: recordedTransactions.length,
    };
  }, [purchaseTransactions]);

  // MONTHLY EXPENDITURE CHART
  const monthlyExpenses = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = getMonthKey(date);

      const initial = purchaseTransactions
        .filter(
          (transaction) =>
            transaction.type === "Initial Purchase" &&
            transaction.date &&
            getMonthKey(transaction.date) === key
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const refills = purchaseTransactions
        .filter(
          (transaction) =>
            transaction.type === "Refill" &&
            transaction.date &&
            getMonthKey(transaction.date) === key
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      months.push({
        label: getMonthLabel(date),
        initial,
        refills,
        total: initial + refills,
      });
    }

    return months;
  }, [purchaseTransactions]);

  // MEDICINE-WISE EXPENDITURE
  const medicineExpenses = useMemo(() => {
    const grouped = {};

    purchaseTransactions.forEach((transaction) => {
      const id = transaction.medicineId;

      if (!grouped[id]) {
        grouped[id] = {
          name: transaction.medicineName,
          initial: 0,
          refills: 0,
          total: 0,
          transactions: 0,
        };
      }

      if (transaction.type === "Initial Purchase") {
        grouped[id].initial += transaction.amount;
      } else {
        grouped[id].refills += transaction.amount;
      }

      grouped[id].total += transaction.amount;
      grouped[id].transactions++;
    });

    return Object.values(grouped).sort(
      (a, b) => b.total - a.total
    );
  }, [purchaseTransactions]);

  // REFILL ANALYTICS
  const refillStats = useMemo(() => {
    const refills = medicines.flatMap((medicine) =>
      (medicine.refillHistory || []).map((refill) => ({
        medicineName: medicine.medicineName,
        quantityAdded: Number(refill.quantityAdded) || 0,
        amountPaid: Number(refill.amountPaid) || 0,
        refillDate: refill.refillDate,
      }))
    );

    const totalUnits = refills.reduce(
      (sum, refill) => sum + refill.quantityAdded,
      0
    );

    const medicineCounts = {};

    refills.forEach((refill) => {
      medicineCounts[refill.medicineName] =
        (medicineCounts[refill.medicineName] || 0) + 1;
    });

    const mostFrequent = Object.entries(medicineCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      refills,
      totalUnits,
      totalTransactions: refills.length,
      uniqueMedicines: Object.keys(medicineCounts).length,
      mostFrequent: mostFrequent ? mostFrequent[0] : "N/A",
    };
  }, [medicines]);

  // CSV EXPORT
  const downloadCSV = (filename, rows) => {
    if (!rows.length) {
      alert("No data available to export.");
      return;
    }

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportExpenseCSV = () => {
    const rows = [
      ["Medicine", "Transaction Type", "Date", "Quantity", "Amount (INR)"],
      ...purchaseTransactions.map((transaction) => [
        transaction.medicineName,
        transaction.type,
        formatDate(transaction.date),
        transaction.quantity,
        transaction.amount,
      ]),
    ];

    downloadCSV("MediShare_Expense_Report.csv", rows);
  };

  const exportInventoryCSV = () => {
    const rows = [
      ["Medicine", "Batch Number", "Quantity", "Expiry Date", "Days Left", "Status"],
      ...medicines.map((medicine) => {
        const days = getDaysLeft(medicine.expiryDate);

        return [
          medicine.medicineName,
          medicine.batchNumber,
          medicine.quantity,
          formatDate(medicine.expiryDate),
          days,
          days < 0 ? "Expired" : days <= 30 ? "At Risk" : "Safe",
        ];
      }),
    ];

    downloadCSV("MediShare_Inventory_Report.csv", rows);
  };

  const maxMonthlyExpense = Math.max(
    ...monthlyExpenses.map((month) => month.total),
    1
  );

  const maxForecast = Math.max(
    ...expiryForecast.map((month) => month.count),
    1
  );

  const maxMedicineExpense = Math.max(
    ...medicineExpenses.map((medicine) => medicine.total),
    1
  );

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5eae7",
    borderRadius: "14px",
    padding: "20px",
  };

  const sectionStyle = {
    background: "#ffffff",
    border: "1px solid #e5eae7",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "22px",
  };

  const headingStyle = {
    color: "#263b32",
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "6px",
  };

  const mutedStyle = {
    color: "#77827c",
    fontSize: "13px",
  };

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ padding: "30px" }}>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div style={{ padding: "30px", color: "#c0392b" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px 0 35px" }}>

        {/* PAGE HEADING */}
        <div style={{ marginBottom: "25px" }}>
          <p style={{ color: "#63947a", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px" }}>
            HOUSEHOLD INSIGHTS
          </p>
          <h1 style={{ color: "#263b32", fontSize: "28px", margin: "8px 0" }}>
            Wastage & Expense Trends
          </h1>
          <p style={mutedStyle}>
            Monitor medicine expiry, inventory usage, purchases and household spending.
          </p>
        </div>

        {/* EXPIRY OVERVIEW */}
        <h2 style={headingStyle}>Expiry Overview</h2>
        <p style={{ ...mutedStyle, marginBottom: "15px" }}>
          Understand the current condition of your medicine inventory.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "14px",
          marginBottom: "25px",
        }}>
          {[
            ["Total Medicines", expiryStats.total, "#497c66"],
            ["Expired Medicines", expiryStats.expired, "#cf5555"],
            ["Expiring in 7 Days", expiryStats.expiring7, "#dc8645"],
            ["Expiring in 15 Days", expiryStats.expiring15, "#c49b43"],
            ["Expiring in 30 Days", expiryStats.expiring30, "#628fb6"],
            ["Safe Medicines", expiryStats.safe, "#58a67c"],
          ].map(([label, value, color]) => (
            <div key={label} style={cardStyle}>
              <div style={{ ...mutedStyle, marginBottom: "12px" }}>{label}</div>
              <div style={{ fontSize: "27px", fontWeight: 700, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* EXPIRY FORECAST */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Six-Month Expiry Forecast</h2>
          <p style={{ ...mutedStyle, marginBottom: "22px" }}>
            Number of medicines expected to expire in each month.
          </p>

          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
            height: "190px",
            paddingTop: "10px",
          }}>
            {expiryForecast.map((month) => (
              <div key={month.label} style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                gap: "8px",
              }}>
                <strong style={{ fontSize: "12px", color: "#53645b" }}>
                  {month.count}
                </strong>
                <div style={{
                  width: "65%",
                  minWidth: "12px",
                  height: `${Math.max((month.count / maxForecast) * 125, 3)}px`,
                  background: "#78a88b",
                  borderRadius: "6px 6px 0 0",
                }} />
                <span style={{ fontSize: "11px", color: "#77827c" }}>
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* INVENTORY BREAKDOWN */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Inventory Breakdown</h2>
          <p style={{ ...mutedStyle, marginBottom: "20px" }}>
            Distribution of medicines according to their expiry status.
          </p>

          {inventoryBreakdown.map((item) => (
            <div key={item.label} style={{ marginBottom: "16px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "7px",
                fontSize: "13px",
              }}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>

              <div style={{
                height: "9px",
                background: "#edf1ee",
                borderRadius: "10px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${expiryStats.total ? (item.count / expiryStats.total) * 100 : 0}%`,
                  height: "100%",
                  background: item.color,
                  borderRadius: "10px",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* MEDICINES AT RISK */}
        <div style={sectionStyle}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div>
              <h2 style={headingStyle}>Medicines at Risk</h2>
              <p style={mutedStyle}>Expired medicines and medicines expiring within 30 days.</p>
            </div>

            <button
              onClick={exportInventoryCSV}
              style={buttonStyle}
            >
              Export Inventory CSV
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine</th>
                  <th style={thStyle}>Batch</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Expiry Date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {riskMedicines.map((medicine) => {
                  const days = getDaysLeft(medicine.expiryDate);

                  return (
                    <tr key={medicine._id}>
                      <td style={tdStyle}>{medicine.medicineName}</td>
                      <td style={tdStyle}>{medicine.batchNumber}</td>
                      <td style={tdStyle}>{medicine.quantity} {medicine.unit}</td>
                      <td style={tdStyle}>{formatDate(medicine.expiryDate)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          color: days < 0 ? "#c0392b" : days <= 7 ? "#d07836" : "#a17e28",
                          fontWeight: 600,
                        }}>
                          {days < 0 ? "Expired" : days === 0 ? "Expires today" : `${days} days left`}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {riskMedicines.length === 0 && (
                  <tr>
                    <td colSpan="5" style={emptyStyle}>
                      No medicines are currently at expiry risk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REFILL ANALYTICS */}
        <h2 style={headingStyle}>Refill Analytics</h2>
        <p style={{ ...mutedStyle, marginBottom: "15px" }}>
          Track replenishment activity across your household.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}>
          {[
            ["Total Refill Transactions", refillStats.totalTransactions],
            ["Total Units Replenished", refillStats.totalUnits],
            ["Medicines Replenished", refillStats.uniqueMedicines],
            ["Most Frequently Refilled", refillStats.mostFrequent],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle}>
              <div style={{ ...mutedStyle, marginBottom: "12px" }}>{label}</div>
              <div style={{
                color: "#477b62",
                fontSize: label === "Most Frequently Refilled" ? "19px" : "27px",
                fontWeight: 700,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>Complete Refill History</h2>

          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Quantity Added</th>
                  <th style={thStyle}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {refillStats.refills
                  .slice()
                  .sort((a, b) => new Date(b.refillDate) - new Date(a.refillDate))
                  .map((refill, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>{refill.medicineName}</td>
                      <td style={tdStyle}>{formatDate(refill.refillDate)}</td>
                      <td style={tdStyle}>{refill.quantityAdded}</td>
                      <td style={tdStyle}>{money(refill.amountPaid)}</td>
                    </tr>
                  ))}

                {refillStats.refills.length === 0 && (
                  <tr>
                    <td colSpan="4" style={emptyStyle}>No refill records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXPENSE ANALYTICS */}
        <div style={{
          marginTop: "35px",
          marginBottom: "20px",
        }}>
          <p style={{ color: "#63947a", fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px" }}>
            PURCHASE MANAGEMENT
          </p>
          <h2 style={{ color: "#263b32", fontSize: "25px", margin: "7px 0" }}>
            Expense Analytics
          </h2>
          <p style={mutedStyle}>
            Track initial medicine purchases and subsequent refill expenditure.
          </p>
        </div>

        {/* EXPENSE SUMMARY CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}>
          {[
            ["Total Expenditure", money(expenseStats.total)],
            ["Current Month Spending", money(expenseStats.currentMonth)],
            ["Purchase Transactions", expenseStats.transactions],
            ["Average Purchase Amount", money(expenseStats.average)],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle}>
              <div style={{ ...mutedStyle, marginBottom: "12px" }}>{label}</div>
              <div style={{
                fontSize: "23px",
                fontWeight: 700,
                color: "#477b62",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          ...sectionStyle,
          background: "#f8faf8",
        }}>
          <p style={{ fontSize: "13px", color: "#56685e", margin: 0 }}>
            <strong>Expense data coverage:</strong> {expenseStats.recordedTransactions} of {expenseStats.transactions} transactions have recorded amounts. Older initial purchases without an amount are counted as unrecorded and contribute ₹0 to the expenditure total.
          </p>
        </div>

        {/* MONTHLY EXPENDITURE CHART */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Monthly Expenditure</h2>
          <p style={{ ...mutedStyle, marginBottom: "22px" }}>
            Initial purchases and refills over the last six months.
          </p>

          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "14px",
            height: "220px",
          }}>
            {monthlyExpenses.map((month) => (
              <div key={month.label} style={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "8px",
              }}>
                <strong style={{
                  fontSize: "11px",
                  color: "#53645b",
                  textAlign: "center",
                }}>
                  {money(month.total)}
                </strong>

                <div style={{
                  width: "70%",
                  maxWidth: "55px",
                  height: `${Math.max((month.total / maxMonthlyExpense) * 145, 3)}px`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  overflow: "hidden",
                  borderRadius: "6px 6px 0 0",
                }}>
                  <div style={{
                    height: `${month.total ? (month.initial / month.total) * 100 : 0}%`,
                    background: "#75a88a",
                    minHeight: month.initial > 0 ? "2px" : 0,
                  }} />
                  <div style={{
                    height: `${month.total ? (month.refills / month.total) * 100 : 0}%`,
                    background: "#e2b45c",
                    minHeight: month.refills > 0 ? "2px" : 0,
                  }} />
                </div>

                <span style={{ fontSize: "11px", color: "#77827c" }}>
                  {month.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            marginTop: "18px",
            flexWrap: "wrap",
          }}>
            <span style={{ ...mutedStyle, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "#75a88a", borderRadius: "2px" }} />
              Initial purchases
            </span>
            <span style={{ ...mutedStyle, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", background: "#e2b45c", borderRadius: "2px" }} />
              Refills
            </span>
          </div>
        </div>

        {/* MEDICINE WISE EXPENSES */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Highest-Spending Medicines</h2>
          <p style={{ ...mutedStyle, marginBottom: "20px" }}>
            Medicines ranked by total recorded purchase expenditure.
          </p>

          {medicineExpenses.slice(0, 5).map((medicine, index) => (
            <div key={index} style={{ marginBottom: "18px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "7px",
                fontSize: "13px",
              }}>
                <strong>{medicine.name}</strong>
                <strong>{money(medicine.total)}</strong>
              </div>

              <div style={{
                height: "9px",
                background: "#edf1ee",
                borderRadius: "10px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${(medicine.total / maxMedicineExpense) * 100}%`,
                  background: "#75a88a",
                  borderRadius: "10px",
                }} />
              </div>
            </div>
          ))}

          {medicineExpenses.length === 0 && (
            <p style={emptyStyle}>No purchase records available.</p>
          )}
        </div>

        {/* MEDICINE EXPENSE BREAKDOWN */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Medicine-wise Expense Breakdown</h2>

          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine</th>
                  <th style={thStyle}>Initial Purchase</th>
                  <th style={thStyle}>Refill Expenses</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {medicineExpenses.map((medicine, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{medicine.name}</td>
                    <td style={tdStyle}>{money(medicine.initial)}</td>
                    <td style={tdStyle}>{money(medicine.refills)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {money(medicine.total)}
                    </td>
                    <td style={tdStyle}>{medicine.transactions}</td>
                  </tr>
                ))}

                {medicineExpenses.length === 0 && (
                  <tr>
                    <td colSpan="5" style={emptyStyle}>
                      No expense data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMPLETE PURCHASE HISTORY */}
        <div style={sectionStyle}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div>
              <h2 style={headingStyle}>Complete Purchase History</h2>
              <p style={mutedStyle}>
                All initial purchases and subsequent refills.
              </p>
            </div>

            <button
              onClick={exportExpenseCSV}
              style={buttonStyle}
            >
              Export Expense CSV
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Medicine</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {purchaseTransactions.map((transaction, index) => (
                  <tr key={`${transaction.medicineId}-${transaction.type}-${index}`}>
                    <td style={tdStyle}>{transaction.medicineName}</td>
                    <td style={tdStyle}>{transaction.type}</td>
                    <td style={tdStyle}>{formatDate(transaction.date)}</td>
                    <td style={tdStyle}>{transaction.quantity}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {transaction.recorded
                        ? money(transaction.amount)
                        : "Not recorded"}
                    </td>
                  </tr>
                ))}

                {purchaseTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={emptyStyle}>
                      No purchase transactions available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SMART TIPS */}
        <div style={{
          ...sectionStyle,
          background: "#f5faf6",
          border: "1px solid #dcebe0",
        }}>
          <h2 style={headingStyle}>Smart Inventory Tips</h2>

          <ul style={{
            color: "#53645b",
            fontSize: "14px",
            lineHeight: 2,
            paddingLeft: "20px",
            marginBottom: 0,
          }}>
            <li>Prioritise using medicines that are closest to their expiry date.</li>
            <li>Check medicines with low stock before making new purchases.</li>
            <li>Review the expiry risk table regularly to reduce medicine wastage.</li>
            <li>Compare monthly expenditure to understand household medicine spending.</li>
            <li>Record the actual amount paid for every initial purchase and refill.</li>
            <li>Review frequently replenished medicines to plan future purchases.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

const buttonStyle = {
  background: "#477b62",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 15px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "600px",
  textAlign: "left",
};

const thStyle = {
  padding: "12px",
  fontSize: "12px",
  color: "#66756c",
  background: "#f5f8f5",
  borderBottom: "1px solid #e5eae7",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "13px 12px",
  fontSize: "13px",
  color: "#43544a",
  borderBottom: "1px solid #edf0ed",
};

const emptyStyle = {
  padding: "25px",
  textAlign: "center",
  color: "#89938d",
  fontSize: "13px",
};

export default WastageTrends;
