import React, { useState } from 'react';
import { Typography } from '@mui/joy';
import TransactionsTable from './components/TransactionsTable';
import Dashboard from './components/Dashboard';
import Recommendations from './components/Recommendations';
import Reports from './components/Reports';
import SplitLayout from './components/SplitLayout';
import { Grid } from '@mui/joy';
import Button from '@mui/joy/Button';
type ViewType = 'transactions' | 'dashboard' | 'reports' | 'recommendations';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('transactions');

  const renderView = () => {
    switch (activeView) {
      case 'transactions':
        return <TransactionsTable />;
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return <Reports />;
      case 'recommendations':
        return <Recommendations />;
      default:
        return <div>empty</div>;
    }
  };

  const leftPanelContent = (
    <div style={{ padding: '16px' }}>
      <Grid container direction="column" spacing={2}>
        <Grid>
          <Button 
            variant={activeView === 'transactions' ? 'solid' : 'plain'}
            color={activeView === 'transactions' ? 'primary' : 'neutral'}
            onClick={() => setActiveView('transactions')}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Transactions
          </Button>
        </Grid>
        <Grid>
          <Button 
            variant={activeView === 'dashboard' ? 'solid' : 'plain'}
            color={activeView === 'dashboard' ? 'primary' : 'neutral'}
            onClick={() => setActiveView('dashboard')}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Dashboard
          </Button>
        </Grid>
        <Grid>
          <Button 
            variant={activeView === 'reports' ? 'solid' : 'plain'}
            color={activeView === 'reports' ? 'primary' : 'neutral'}
            onClick={() => setActiveView('reports')}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Reports
          </Button>
        </Grid>
        <Grid>
          <Button 
            variant={activeView === 'recommendations' ? 'solid' : 'plain'}
            color={activeView === 'recommendations' ? 'primary' : 'neutral'}
            onClick={() => setActiveView('recommendations')}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Recommendations
          </Button>
        </Grid>
      </Grid>
    </div>
  );

  const rightPanelContent = (
    <div style={{ height: '100%', padding: '16px' }}>
      {renderView()}
    </div>
  );

  return (
<SplitLayout 
        leftPanel={leftPanelContent}
        rightPanel={rightPanelContent}
        initialLeftWidth={200}
        minLeftWidth={150}
        maxLeftWidth={300}
      />
  );
}
