import {defineZodTool} from '../define-tool.ts'
import {z} from 'zod'
import {appendQueryParams} from '../url-params.ts'
import {ModelState} from '../../state/model-state.ts'

export default defineZodTool({
    desc: "Get a URL for a static Google Map image, optionally with markers, paths, and custom styling. The API key is added automatically.",
    params: z.object({
        center: z.string().optional().describe("The center of the map, as a string address (e.g., 'city hall, new york, ny') or a comma-separated {latitude,longitude} pair. Required if no markers are present."),
        zoom: z.number().int().min(0).max(21).optional().describe("The zoom level of the map. 0 is the whole world, 21 is individual buildings."),
        size: z.string().regex(/^\d+x\d+$/, "Size must be in the format 'widthxheight'").default("600x400").describe("The rectangular dimensions of the map image in pixels, e.g., '600x400'."),
        scale: z.enum(['1', '2']).optional().describe("Set to '2' to return a map with twice the number of pixels, for high-resolution displays."),
        format: z.enum(['png', 'png8', 'gif', 'jpg', 'jpg-baseline']).optional().describe("The image format for the map."),
        maptype: z.enum(['roadmap', 'satellite', 'terrain', 'hybrid']).optional().describe("The type of map to construct."),
        language: z.string().optional().describe("The language to use for displaying labels, e.g., 'en' or 'es'."),
        region: z.string().optional().describe("The appropriate country code (ccTLD) to bias the map results, e.g., 'US' or 'FR'."),
        markers: z.array(z.string()).optional().describe("An array of locations to place markers. Locations can be addresses or lat/lng pairs, e.g., ['Brooklyn Bridge,New York,NY', '40.702147,-74.015794']."),
        path: z.array(z.string()).optional().describe("An array of two or more locations defining a path. The path will be drawn connecting these points."),
        visible: z.array(z.string()).optional().describe("An array of locations that should be visible on the map, even if no markers or paths are specified."),
        map_id: z.string().optional().describe("A specific map ID to use for cloud-based maps styling."),
    }),
    exec: (params) => {
        // Destructure to separate the complex array params from the simple ones.
        const {markers, path, visible, ...simpleParams} = params

        // The Google API expects array-like parameters as a single, pipe-separated string.
        const apiParams: Record<string, string | number | undefined> = {...simpleParams}

        if(markers && markers.length > 0) {
            apiParams.markers = markers.join('|')
        }
        if(path && path.length > 0) {
            apiParams.path = path.join('|')
        }
        if(visible && visible.length > 0) {
            apiParams.visible = visible.join('|')
        }

        return {
            imageUrl: appendQueryParams('https://maps.googleapis.com/maps/api/staticmap', {
                ...apiParams,
                key: ModelState.getSnapshot().googleMapsKey,
            })
        }
    }
})
