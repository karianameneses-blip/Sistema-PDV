/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TelaLogin } from './components/auth/TelaLogin';
import { FrenteCaixa } from './components/pdv/FrenteCaixa';
import { DashboardAdmin } from './components/retaguarda/DashboardAdmin';
import { EspecificacaoArquitetura } from './components/docs/EspecificacaoArquitetura';

const RoteadorPrincipal: React.FC = () => {
  const { usuarioLogado, telaAtiva } = useApp();

  if (!usuarioLogado || telaAtiva === 'LOGIN') {
    return <TelaLogin />;
  }

  if (telaAtiva === 'ARQUITETURA') {
    return <EspecificacaoArquitetura />;
  }

  if (telaAtiva === 'PDV') {
    return <FrenteCaixa />;
  }

  // Dashboard Administrador e telas de Retaguarda
  return <DashboardAdmin />;
};

export default function App() {
  return (
    <AppProvider>
      <RoteadorPrincipal />
    </AppProvider>
  );
}

