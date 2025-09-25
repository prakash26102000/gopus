import React from "react";

const AboutUs = () => {
  const containerStyle = {
    minHeight: "60vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: "1rem",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "1rem",
    borderRadius: "1rem",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "0.3rem",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "0.3rem",
  };

  const textStyle = {
    color: "#4b5563",
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>About Us</h1>
        <p style={textStyle}>
          Welcome to our About Us page! We are passionate about delivering quality and value.
          Learn more about our journey, mission, and the values that drive us every day.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
