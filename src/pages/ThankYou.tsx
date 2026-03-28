import { useEffect, useState } from "react";

function parseCSVLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export default function ThankYou() {
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQTwPzzgnuxnM99svb-wpxDwzfPA-3lZP9cVqLv4hMH0GtKLollq3-tOFZ0jgzug_-vl3zXvo_HBYNs/pub?gid=43987342&single=true&output=csv"
    )
      .then((res) => res.text())
      .then((data) => {
        const rows = data.trim().split(/\r?\n/);

        if (rows.length < 2) {
          setDate("No data found");
          return;
        }

        const headers = parseCSVLine(rows[0]);
        const values = parseCSVLine(rows[1]);

        console.log("HEADERS:", headers);
        console.log("VALUES:", values);

        // change this index if your date is in another column
        const quizDate = values[3];

        setDate(quizDate ? quizDate.replace(/"/g, "").trim() : "Not found");
      })
      .catch((err) => {
        console.error(err);
        setDate("Error loading");
      });

       if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", "Purchase", {
      value: 1499,
      currency: "INR",
    });

    (window as any).fbq("trackCustom", "1499-quiz-paid", {
      value: 1499,
      currency: "INR",
    });
  }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F5FF",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          padding: "30px",
          borderRadius: "16px",
          textAlign: "center",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "26px", fontWeight: 700 }}>
          🎉 Payment Successful!
        </h1>

        <p style={{ marginTop: "10px", fontSize: "15px", color: "#555" }}>
          You're successfully registered for the{" "}
          <strong>5-Day Advanced Manifestation Bootcamp</strong>.
        </p>

        <p style={{ marginTop: "8px", fontSize: "14px", color: "#777" }}>
          📅 Starts from: <strong>{date || "Loading..."}</strong>
        </p>

        <a
          href="https://join.ankitneerav.com/5day-wap-oto"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "20px",
            padding: "12px 20px",
            background: "#6B3FA0",
            color: "#fff",
            borderRadius: "10px",
            textDecoration: "none",
          }}
        >
          Join WhatsApp Group
        </a>
      </div>
    </div>
  );
}