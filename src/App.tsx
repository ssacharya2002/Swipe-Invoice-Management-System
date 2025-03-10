import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Provider store={store}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice Management System
          </h1>
        </div>
      </header>
      <Toaster position="bottom-right" />
    </Provider>
  );
}

export default App;
