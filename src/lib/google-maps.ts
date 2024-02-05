import {appendQueryParams} from './url-params.ts'


export function getGoogleMapsDirectionsUrl(waypoints: string[], travelmode='driving') {
    let origin = ''
    let destination = '';
    if(waypoints.length) {
        origin = waypoints.shift()!
        if(waypoints.length) {
            destination = waypoints.pop()!
        }
    }
    const params: Record<string,string|number> = {
        api: 1,
        travelmode,
        origin,
        destination,
    }
    if(waypoints.length) {
        params.waypoints = waypoints.join('|')
    }

    return appendQueryParams('https://www.google.com/maps/dir/', params)
}
