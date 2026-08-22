const CAPTURE_PATTERN=/decklink|ultrastudio|blackmagic|cam\s*link|avermedia|elgato|magewell|\baja\b|capture|\bsdi\b|\bhdmi\b|usb video/i;
const WEBCAM_PATTERN=/webcam|integrated|facetime|front camera|rear camera|brio|streamcam|lifecam|c9\d{2}|obs virtual camera|virtual camera/i;
export function classifyVideoDevice(label=""){if(CAPTURE_PATTERN.test(label))return"capture";if(WEBCAM_PATTERN.test(label))return"webcam";return"webcam";}
export function sourceTypeLabel(type){return type==="capture"?"CAPTURE DEVICE":type.toUpperCase();}
