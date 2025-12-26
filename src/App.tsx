import "./App.css";
import HandwritingApp from "./components/HandwritingApp";

function App() {
  return (
    <>
      <h1 className="text-3xl font-bold underline">
        Personalized Handwriting Generator
      </h1>
      <HandwritingApp />
      {/* <HandwritingPadNew /> */}
    </>
  );
}

export default App;
