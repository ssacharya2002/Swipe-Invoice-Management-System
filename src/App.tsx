import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "react-hot-toast";
import TabContent from "./components/TabContent";

function App() {
  return (
    <Provider store={store}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice Management System
          </h1>
        </div>
      </header>
      <TabContent />
      <Toaster position="top-center" />
    </Provider>
  );
}

export default App;
