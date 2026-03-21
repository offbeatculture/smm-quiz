export default function ThankYou() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F5FF",
      padding: "20px"
    }}>
      <div style={{
        background: "#FFFFFF",
        padding: "30px",
        borderRadius: "16px",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700 }}>
          🎉 Payment Successful!
        </h1>

        <p style={{ marginTop: "10px", fontSize: "15px", color: "#555" }}>
          You're successfully registered for the 5-Day Bootcamp.
        </p>

        {/* <p style={{ marginTop: "10px", fontSize: "14px", color: "#777" }}>
          You will receive joining details on WhatsApp & Email within 24 hours.
        </p> */}

        <a href="/" style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "12px 20px",
          background: "#6B3FA0",
          color: "#fff",
          borderRadius: "10px",
          textDecoration: "none"
        }}>
          Join Whatsapp group
        </a>
      </div>
    </div>
  );
}