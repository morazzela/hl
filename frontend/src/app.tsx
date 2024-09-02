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
import { AuthLayout } from "./routes/auth/layout";
import Login from "./routes/auth/login";
import Register from "./routes/auth/register";
import Verify from "./routes/auth/verify";
import { FavoritesProvider } from "./providers/FavoritesProvider";

export default function App() {
  return (
    <ThemeProvider>
      <HyperliquidSocketProvider>
        <CoinsProvider>
          <SidebarProvider>
            <FavoritesProvider>
              <Router>
                <Route path="/" component={Layout}>
                  <Route path="/" component={Home} />
                  <Route path="/w/:id" component={Wallet}>
                    <Route path="/" component={() => <></>} />
                    <Route path="/p/:coin" component={Position} />
                  </Route>
                </Route>
                <Route component={AuthLayout}>
                  <Route path="/login" component={Login} />
                  <Route path="/register" component={Register} />
                  <Route path="/verify" component={Verify} />
                </Route>
              </Router>
            </FavoritesProvider>
          </SidebarProvider>
        </CoinsProvider>
      </HyperliquidSocketProvider>
    </ThemeProvider>
  );
}
