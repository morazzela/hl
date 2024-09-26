import { Route, Router } from "@solidjs/router";
import "./styles/app.scss";
import Layout from "./routes/layout";
import { CoinsProvider } from "./providers/CoinsProvider";
import Home from "./routes";
import { ThemeProvider } from "./providers/ThemeProvider";
import Wallet from "./routes/wallet";
import { HyperliquidSocketProvider } from "./providers/HyperliquidSocketProvider";
import Position from "./routes/position";
import { SidebarProvider } from "./providers/SidebarProvider";

export default function App() {
  return (
    <ThemeProvider>
      <HyperliquidSocketProvider>
        <CoinsProvider>
          <SidebarProvider>
            <Router>
              <Route path="/" component={Layout}>
                <Route path="/" component={Home} />
                <Route path="/w/:id" component={Wallet}>
                  <Route path="/" component={() => <></>} />
                  <Route path="/p/:coin" component={Position} />
                </Route>
              </Route>
            </Router>
          </SidebarProvider>
        </CoinsProvider>
      </HyperliquidSocketProvider>
    </ThemeProvider>
  );
}
