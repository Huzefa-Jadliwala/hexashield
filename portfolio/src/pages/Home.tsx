import Header from "../components/Header.tsx";
import Team from "../components/Team/Team.tsx";
import HomeBanner from "../components/HomeBanner.tsx";
import ContactUsForm from "../components/ContactUsForm.tsx";
import "react-toastify/dist/ReactToastify.css";
import Values from "../components/Values.tsx";
import 'react-toastify/dist/ReactToastify.css';
import CompanyValues from "../components/CompanyValues.tsx";

export default function Home() {
  return (
    <>
      <Header />
      <HomeBanner />
      <CompanyValues />
      <Values />
      <Team />
      <ContactUsForm />
    </>
  );
}
