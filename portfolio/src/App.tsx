import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from ".//pages/Home";
import BlogList from "./components/BlogList";
import BlogDetail from "./components/BlogDetail";
import Features from "./components/Features";
import Layout from "./components/Layout";
import { Buffer } from "buffer";
import ContactUsForm from "./components/ContactUsForm";

// Polyfill Buffer globally
(window as any).Buffer = Buffer;

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blogs/:blogId" element={<BlogDetail />} />
          <Route path="Features" element={<Features />} />
          <Route path="contact" element={<ContactUsForm />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
