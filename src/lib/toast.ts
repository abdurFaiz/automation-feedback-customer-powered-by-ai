// Simple toast utility - you can replace this with a proper toast library later
export const toast = {
    success: (message: string) => {
        // For now, use alert - you can replace with proper toast implementation
        alert(`✅ ${message}`);
    },
    error: (message: string) => {
        alert(`❌ ${message}`);
    },
    info: (message: string) => {
        alert(`ℹ️ ${message}`);
    },
    warning: (message: string) => {
        alert(`⚠️ ${message}`);
    },
};

// If you want to install a proper toast library later, you can use:
// npm install react-hot-toast
// or
// npm install sonner
// or
// npm install react-toastify