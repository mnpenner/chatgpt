import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'

function getCurrentPosition(): Promise<GeolocationPosition> {
    if (!navigator.geolocation?.getCurrentPosition) throw new Error("navigator.geolocation is unavailable");
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5_000,
    }));
}

export default defineZodTool({
    desc: "Get the geo location (latitude and longitude) of the user",
    params: z.object({}),
    exec: async () => {
        const pos = await getCurrentPosition();
        return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    },
})
