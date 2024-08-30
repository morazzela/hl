import { Route, Router } from "@solidjs/router";
import "./styles/app.scss";
import Layout from "./layout";
import { CoinsProvider } from "./providers/CoinsProvider";
import Home from "./routes";
import { ThemeProvider } from "./providers/ThemeProvider";
import Wallet from "./routes/wallet";
import { HyperliquidSocketProvider } from "./providers/HyperliquidSocketProvider";
import Position from "./routes/position";

export default function App() {
  return (
    <ThemeProvider>
      <HyperliquidSocketProvider>
        <CoinsProvider>
          <Router root={Layout}>
            <Route path="/" component={Home}/>
            <Route path="/w/:id" component={Wallet}>
              <Route path="/" component={() => <></>}/>
              <Route path="/p/:coin" component={Position}/>
            </Route>
          </Router>
        </CoinsProvider>
      </HyperliquidSocketProvider>
    </ThemeProvider>
  );
}
