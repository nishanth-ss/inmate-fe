import axios from "axios";
export async function usePostData(url, payLoad, method = "post") {
    const token = localStorage.getItem("authToken");

    try {
        const response = await axios({
            method: method,
            url: `${import.meta.env.VITE_API_URL}${url}`,
            data: payLoad,
            headers: { Authorization: `Bearer ${token}` },
        });

        // Return only the backend data
        return { data: response.data, error: null };
    } catch (error) {
        // Return backend error if available
        return { data: null, error: error.response?.data || error };
    }
}
