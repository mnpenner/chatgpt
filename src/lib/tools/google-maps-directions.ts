import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'
import {getGoogleMapsDirectionsUrl} from '../google-maps.ts'

export default defineZodTool({
    desc: "Return a URL to Google Maps for travel directions.",
    params: z.object({
        waypoints: z.array(z.string()).min(2).describe("List of waypoints. Must contain an origin and destination at a minimum."),
        travelmode: z.string().optional().describe(`Travel mode (e.g., "DRIVING", "BICYCLING").`),
    }),
    exec: ({ waypoints, travelmode }) => ({ directionsUrl: getGoogleMapsDirectionsUrl(waypoints, travelmode) }),
})
