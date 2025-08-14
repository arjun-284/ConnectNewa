import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Components
import Navigation from '../Components/Navigation'
import CategoryTabs from '../Components/CategoryTabs'
import FilterBar from '../Components/FilterBar'
import ExploreCard from '../Components/ExploreCard'
import Footer from '../Components/Footer'
import LogoutButton from '../Components/logout'
import BookTicketModal from '../Components/BookTicketModal'
import Invoice from '../Components/Invoice' 

// Pages
import Home from './Pages/Home'
import Login from './Pages/Login'
import Explore from './Pages/Explore'
import Event from './Pages/Event'
import Community from './Pages/Community'
import Contributes from './Pages/Contributes'
import Sign from './Pages/Signup'
import InvoicePage from './Pages/InvoicePage' // <-- Invoice Page Import
import MyTickets from './Pages/MyTickets';
import OrganizerTicketSales from './Users/OrganizerTicketSales';

// Users/Admin
import Contributorsd from './Users/Contributorsd'
import Organizers from './Users/Organizers'
import Admin from './admin/Dashboardadmin'
import List from './admin/User'
import Dashboard from './admin/Dash'
import Organizors from './admin/organizor'
import UserApprove from './admin/userapp'
import MyEvents from './Users/Organizers'
import AdminContributer from './admin/adminContributer'
import Exploreadmin from './admin/Exploreadmin'
import AdminAmountCollection from './admin/AdminsaleCommison'
import ParticipateDashboard from './Users/ParticipateDashboard'
import PerformanceDashboard from './Users/PerformanceDashboard';
import CompetitorDashboard from './Users/CompetitorDashboard';

function App() {
  return (
    <div style={{ width: "99vw", minHeight: "50vh", background: "#fff", margin: 0, padding: 0 }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/event" element={<Event />} />
          <Route path="/community" element={<Community />} />
          <Route path="/contributes" element={<Contributes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="/contributors" element={<Contributorsd />} />
          <Route path="/organizers" element={<MyEvents />} />
          <Route path="/logout" element={<LogoutButton />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="organizer-ticket-sales" element={<OrganizerTicketSales />} />

          {/* ✅ Invoice Page Route */}
          <Route path="/invoice/:ticketId" element={<InvoicePage />} />

          {/* Admin Nested Layout */}
          <Route path="/admin" element={<Admin />}>
            <Route path="organizor" element={<Organizors />} />
            <Route path="users" element={<List />} />
            <Route path="Approval" element={<UserApprove />} />
            <Route path="contributorscur" element={<AdminContributer />} />
            <Route path="exploreadmin" element={<Exploreadmin />} />
            <Route path="amount" element={<AdminAmountCollection />} />
            <Route index element={<Dashboard />} />
            
          </Route>
          
        <Route path="/participate" element={<ParticipateDashboard />}>
  <Route path="performance" element={<PerformanceDashboard />} />
  <Route path="competitor" element={<CompetitorDashboard />} />
</Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
