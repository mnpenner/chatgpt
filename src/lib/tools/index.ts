// tools/index.ts

import type { ToolImplementation } from '../define-tool.ts';

// Import all tool definitions from their individual files
import getDatetimeTool from './get-datetime.ts';
import getPositionTool from './get-position.ts';
import evalJsTool from './eval-js.ts';
import googleMapsDirectionsTool from './google-maps-directions.ts';
import staticGoogleMapTool from './static-google-map.ts';
import robohashTool from './robohash.ts';

/**
 * A record containing all available tool implementations, keyed by their name.
 * This is the single source of truth for all tools in the application.
 */
const toolImplementations: Record<string, ToolImplementation> = {
    'get_datetime': getDatetimeTool,
    'get_position': getPositionTool,
    'eval_js': evalJsTool,
    'google_maps_directions': googleMapsDirectionsTool,
    'static_google_map': staticGoogleMapTool,
    'robohash': robohashTool,
};

export default toolImplementations;
