import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import Dashboard from "./Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      {/* If Signed Out, show SignIn component centered */}
      <SignedOut>
        <div className="flex-1 flex items-center justify-center py-12">
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      {/* If Signed In, show the Dashboard */}
      <SignedIn>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </SignedIn>
    </div>
  );
}

export default App;
