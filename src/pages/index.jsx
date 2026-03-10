import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import NovaOS from "./NovaOS";

import Clientes from "./Clientes";

import VisualizarOS from "./VisualizarOS";

import Configuracoes from "./Configuracoes";

import PerfilCliente from "./PerfilCliente";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    NovaOS: NovaOS,
    
    Clientes: Clientes,
    
    VisualizarOS: VisualizarOS,
    
    Configuracoes: Configuracoes,
    
    PerfilCliente: PerfilCliente,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/NovaOS" element={<NovaOS />} />
                
                <Route path="/Clientes" element={<Clientes />} />
                
                <Route path="/VisualizarOS" element={<VisualizarOS />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
                <Route path="/PerfilCliente" element={<PerfilCliente />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}