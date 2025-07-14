import {defineTypeboxTool} from '../define-tool.ts'
import {Type} from '@sinclair/typebox'
import {appendQueryParams} from '../url-params.ts'
import {ModelState} from '../../state/model-state.ts'

export default defineTypeboxTool({
    desc: "Get a URL for a static Google Map image. An API key will automatically be appended to the URL and should not be removed.",
    params: Type.Object({
        center: Type.String({ description: "Defines the center of the map, as a comma-separated {latitude,longitude} pair or a string address." }),
        size: Type.String({ default: "600x600", description: "Defines the rectangular dimensions of the map image, e.g., 500x400." }),
    }),
    exec: (params) => ({
        imageUrl: appendQueryParams('https://maps.googleapis.com/maps/api/staticmap', {
            ...params,
            key: ModelState.getSnapshot().googleMapsKey,
        })
    }),
})
