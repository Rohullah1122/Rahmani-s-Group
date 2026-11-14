import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
  Button,
  Spinner,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import "../style/Contactinfo.css";
import DeleteIcon from '@mui/icons-material/Delete';


function ContactInfo() {
  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readMessages, setReadMessages] = useState(new Set());

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await axios.get("/api/contactform");
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() =>  {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // update the data after every 5 second
    return () => clearInterval(interval);
  }, []);



const handleSelectMessage = async (msg) => {
  setSelectedMsg(msg);
  setMessages((prev) =>
    prev.map((m) =>
      m.id === msg.id ? { ...m, is_read: true } : m
    )
  );
  try {
    await axios.put(`/api/messages/${msg.id}/mark-read`);
  } catch (err) {
    console.error("Error marking message as read:", err);
  }
};






const handleDelete = async (selectedMsg) => {
  if (!selectedMsg) return;
  try {
    await axios.delete(`/api/delete_msg/${selectedMsg.id}`);
    setMessages((prev) => prev.filter((m) => m.id !== selectedMsg.id));
    setSelectedMsg(null);
  } catch (err) {
    console.error("Error deleting message:", err);
  }
};


  return (
    <Container
      fluid
      className="py-4"
      style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}
    >
      <h2 className="text-center mb-4 fw-bold text-dark">
        📨 Customer Contact Messages
      </h2>

      <Row className="h-100 g-3">
        {/* Sidebar */}
        <Col
          md={4}
          className="border-end shadow-sm bg-white rounded p-0"
          style={{
            height: "85vh",
            overflowY: "auto",
            borderRadius: "8px",
          }}
        >
          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : messages.length > 0 ? (
            <ListGroup variant="flush">
              {messages.map((msg) => {
               const isRead = msg.is_read;
                     return (
                  <ListGroup.Item
                    key={msg.id}
                    action
                    onClick={() => handleSelectMessage(msg)}
                    active={selectedMsg?.id === msg.id}
                    className="py-3 border-0 border-bottom d-flex justify-content-between align-items-start"
                    style={{
                      cursor: "pointer",
                      transition: "background 0.3s",
                    }}
                  >
                    <div className="flex-grow-1">
                      <div className="fw-bold d-flex justify-content-between align-items-center">
                        {msg.full_name}
                        <Badge bg="light" text="dark">
                          {new Date(msg.submitted_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <small className="text-muted">{msg.email}</small>
                      <div className="text-truncate mt-1">{msg.message}</div>
                    </div>

                    {!isRead && (
                      <div
                        className="ms-2"
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "red",
                          marginTop: "8px",
                        }}
                      ></div>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          ) : (
            <p className="text-center mt-5 text-muted">No messages found</p>
          )}
        </Col>

        {/* Message details */}
        <Col
          md={8}
          className="d-flex align-items-center justify-content-center position-relative"
        >
          {selectedMsg ? (
          <Card className="w-100 shadow border-0 rounded p-3">
  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
    <div>
      <h5 className="mb-0">{selectedMsg.full_name}</h5>
      <small className="text-light">{selectedMsg.email}</small>
      <br />
      <small className="text-secondary">
        {new Date(selectedMsg.submitted_at).toLocaleString()}
      </small>
    </div>

    {/* 🗑 Delete Icon Button */}
    <Button
      variant="danger"
      size="sm"
      onClick={()=> handleDelete(selectedMsg)}
      title="Delete message"
    >
      <DeleteIcon />
    </Button>
  </Card.Header>

  <Card.Body>
    <p style={{ whiteSpace: "pre-wrap", fontSize: "1.05rem" }}>
      {selectedMsg.message}
    </p>
    <div className="text-end">
      <Button
        variant="primary"
        href={`mailto:${selectedMsg.email}?subject=Re: Your message on Rahmani's Group&body=Hi ${selectedMsg.full_name},%0D%0A%0D%0A`}
      >
        Reply via Email
      </Button>
    </div>
  </Card.Body>
</Card>

          ) : (
            <div className="text-center text-muted">
              <p>Select a message from the left to view details</p>
            </div>
          )}


        </Col>
      </Row>
    </Container>
  );
}

export default ContactInfo;
