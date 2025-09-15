import axios from "axios";

export async function useHandleDelete(url) {
    const token = localStorage.getItem("authToken");

    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}${url}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return { data: response, error: null };
    } catch (error) {
        console.error("Delete error:", error);
        return { data: null, error };
    }
}
