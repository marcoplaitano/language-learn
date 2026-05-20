import Navbar from './Elements/Navbar.tsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useState } from "react";

const PageHome = lazy(() => import("./Pages/PageHome.tsx"));
const PageLearn = lazy(() => import("./Pages/PageLearn.tsx"));
const PageAbout = lazy(() => import("./Pages/PageAbout.tsx"));

export default function App() {
  const [streakTitle, setStreakTitle] = useState<number>(0);

  return (
    <>
      <BrowserRouter>
        <Navbar streakTitle={streakTitle} />
        <Suspense fallback={<main></main>}>
          <Routes>
            <Route path="/"         element={<PageHome setStreakTitle={setStreakTitle} />} />
            <Route path="/learn/"   element={<PageLearn />} />
            <Route path="/about/"   element={<PageAbout />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}
