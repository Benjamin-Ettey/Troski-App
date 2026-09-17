import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import BecomeDriver from "./pages/BecomeDriver";
import DriverApplication from "./pages/DriverApplication";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="services" element={<Services />} />
          <Route path="become-a-driver" element={<BecomeDriver />} />
          <Route path="become-a-driver/apply" element={<DriverApplication />} />
          <Route path="faqs" element={<FAQs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;