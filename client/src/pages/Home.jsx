
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/medicines/priority";

const categories = [
  { title: "Expired medicines", key: "expired", tone: "danger", description: "Need safe disposal" },
  { title: "Expiring today", key: "expiringToday", tone: "warning", description: "Use or review today" },
  { title: "Within 7 days", key: "expiringIn7Days", tone: "warning", description: "Needs attention soon" },
  { title: "Within 15 days", key: "expiringIn15Days", tone: "soft", description: "Coming up next" },
  { title: "Within 30 days", key: "expiringIn30Days", tone: "soft", description: "Plan ahead" },
  { title: "Safe inventory", key: "safeMedicines", tone: "success", description: "No immediate action" }
];

function Home() {
  const [medicines, setMedicines] = useState({
    expired: [],
    expiringToday: [],
    expiringIn7Days: [],
    expiringIn15Days: [],
    expiringIn30Days: [],
    safeMedicines: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load medicines.");
      }

      const data = await response.json();
      setMedicines(data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();

    const interval = setInterval(fetchMedicines, 30000);

    return () => clearInterval(interval);
  }, []);

  const totalMedicines = Object.values(medicines).reduce(
    (total, list) => total + list.length,
    0
  );

  const attentionCount =
    medicines.expired.length +
    medicines.expiringToday.length +
    medicines.expiringIn7Days.length;

  return (
    <div className="page-content">

      <section className="welcome-row">
        <div>
          <p className="eyebrow">YOUR HOUSEHOLD HEALTH SPACE</p>
          <h1>Good day! <span className="wave">✳</span></h1>
          <p className="welcome-copy">
            Here's your medicine inventory at a glance.
            Stay organised and make every medicine count.
          </p>
        </div>

        <a href="/add-medicine" className="primary-button">
          + Add medicine
        </a>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="overview-grid">

        <article className="summary-card">
          <div className="summary-top">
            <span className="summary-label">Total medicines</span>
            <span className="summary-icon">◇</span>
          </div>
          <div className="summary-number">
            {loading ? "—" : totalMedicines}
          </div>
          <p>Items in your household inventory</p>
          <div className="summary-foot">● Inventory overview</div>
        </article>

        <article className="summary-card">
          <div className="summary-top">
            <span className="summary-label">Needs your attention</span>
            <span className="summary-icon warm-icon">!</span>
          </div>
          <div className="summary-number">
            {loading ? "—" : attentionCount}
          </div>
          <p>Expired or expiring within 7 days</p>
          <div className="summary-foot">● Review these medicines</div>
        </article>

        <article className="summary-card">
          <div className="summary-top">
            <span className="summary-label">Safe inventory</span>
            <span className="summary-icon green-icon">✳</span>
          </div>
          <div className="summary-number">
            {loading ? "—" : medicines.safeMedicines.length}
          </div>
          <p>Medicines with more than 30 days left</p>
          <div className="summary-foot">● Looking good</div>
        </article>

      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">INVENTORY HEALTH</p>
          <h2>Expiry overview</h2>
          <p>Keep an eye on medicines that may need action.</p>
        </div>

        <button
          className="secondary-button"
          onClick={fetchMedicines}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </section>

      <section className="expiry-grid">
        {categories.map((category) => (
          <article
            className={`expiry-card ${category.tone}`}
            key={category.key}
          >
            <div className="expiry-card-top">
              <span className="status-dot"></span>
              {category.title}
            </div>

            <strong>
              {loading ? "—" : medicines[category.key].length}
            </strong>

            <p>{category.description}</p>
          </article>
        ))}
      </section>

      <section className="inventory-section">

        <div className="inventory-heading">
          <div>
            <p className="eyebrow">TAKE ACTION</p>
            <h2>Medicine priority list</h2>
            <p>Medicines are grouped by their expiry dates.</p>
          </div>

          <span className="updated-label">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-IN")}`
              : "Waiting for data"}
          </span>
        </div>

        {loading && (
          <div className="empty-state">
            Loading your medicine inventory...
          </div>
        )}

        {!loading && categories.map((category) => {
          const list = medicines[category.key] || [];

          return (
            <article className="medicine-panel" key={category.key}>

              <div className="panel-heading">
                <div>
                  <span className={`panel-indicator ${category.tone}`}></span>
                  <h3>{category.title}</h3>
                  <span className="count-pill">{list.length}</span>
                </div>

                <span className="panel-description">
                  {category.description}
                </span>
              </div>

              {list.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>MEDICINE</th>
                        <th>QUANTITY</th>
                        <th>BATCH NUMBER</th>
                        <th>EXPIRY DATE</th>
                        <th>DAYS LEFT</th>
                        <th>STORAGE</th>
                      </tr>
                    </thead>

                    <tbody>
                      {list.map((medicine) => (
                        <tr key={medicine._id}>
                          <td className="medicine-name">
                            {medicine.medicineName}
                          </td>
                          <td>{medicine.quantity} {medicine.unit}</td>
                          <td>{medicine.batchNumber}</td>
                          <td>
                            {new Date(medicine.expiryDate).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            <span className={`days-badge ${category.tone}`}>
                              {medicine.daysLeft < 0
                                ? `${Math.abs(medicine.daysLeft)} days ago`
                                : medicine.daysLeft === 0
                                ? "Today"
                                : `${medicine.daysLeft} days`}
                            </span>
                          </td>
                          <td>{medicine.storageLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-medicines">
                  No medicines in this category.
                </p>
              )}

            </article>
          );
        })}

      </section>

      <footer className="footer">
        <span>Made with care by MediShare</span>
        <span>Helping households reduce medicine waste</span>
      </footer>

    </div>
  );
}

export default Home;
