// Gear shown in the 3D viewer and the kit list.
// Specs are the manufacturers' headline numbers; edit the notes to say how YOU use each one.
// Each hotspot's `key` matches an anchor point on that model in gear3d.js.
window.GEAR = {
  devices: [
    {
      id: 's5', tab: 'Lumix S5', name: 'Lumix S5', line: 'Panasonic · full-frame mirrorless',
      note: 'My A-cam. Small enough to run the sideline with, and the V-Log footage grades beautifully.',
      specs: [['Sensor', '24.2MP full frame'], ['Video', '4K 60p · 10-bit'], ['Log', 'V-Log / V-Gamut'], ['Stabilisation', '5-axis in-body'], ['Mount', 'L-Mount'], ['Cards', 'Dual SD']],
      hotspots: [
        { key: 'lens', label: 'L-Mount lens', text: 'Shown with the 20–60mm kit zoom: wide enough for crowds, long enough for reactions.' },
        { key: 'record', label: 'Record button', text: 'Tap it. The red tally on the front lights up while it\'s rolling.', action: 'record' },
        { key: 'screen', label: 'Free-angle screen', text: 'Flips out for low angles, overheads and the occasional selfie shot.' },
        { key: 'evf', label: 'Viewfinder', text: 'Bright OLED finder for nailing focus in harsh sun.' },
      ],
    },
    {
      id: 's9', tab: 'Lumix S9', name: 'Lumix S9', line: 'Panasonic · compact full frame',
      note: 'The pocket B-cam. Lives in my bag for BTS, social and anything where a big rig gets in the way.',
      specs: [['Sensor', '24.2MP full frame'], ['Video', '6K 30p open gate'], ['Colour', 'Real Time LUT'], ['Stabilisation', '5-axis in-body'], ['Mount', 'L-Mount'], ['Size', 'No viewfinder, pocketable']],
      colors: [['Jet Black', '#1d1d1f'], ['Crimson Red', '#7a1522'], ['Dark Olive', '#3c4130'], ['Night Blue', '#1e2a3f']],
      hotspots: [
        { key: 'lens', label: 'Pancake lens', text: 'Shown with the 18–40mm: barely sticks out, still covers wide to normal.' },
        { key: 'lut', label: 'LUT button', text: 'Bakes a look into the footage in-camera, so social cuts are ready straight off the card.' },
        { key: 'record', label: 'Record button', text: 'Tap it to roll.', action: 'record' },
        { key: 'screen', label: 'Free-angle screen', text: 'The only screen it has, so it flips every way you need.' },
      ],
    },
    {
      id: 'bm6k', tab: '6K Pro', name: 'Pocket Cinema 6K Pro', line: 'Blackmagic Design · Super 35 cinema camera',
      note: 'The cinema camera for short docs and anything that needs the most room in the grade.',
      specs: [['Sensor', 'Super 35, 6K'], ['Dynamic range', '13 stops'], ['Codecs', 'Blackmagic RAW, ProRes'], ['ND filters', 'Built-in 2, 4 and 6 stop'], ['Screen', '5" tilting HDR, 1500 nits'], ['Mount', 'EF']],
      hotspots: [
        { key: 'lens', label: 'EF mount', text: 'Takes the huge range of EF glass, adapted or native.' },
        { key: 'nd', label: 'Built-in NDs', text: 'Motorised ND filters behind the mount, so wide-open in daylight is one button away.' },
        { key: 'screen', label: '5" HDR screen', text: 'Bright enough to judge exposure outdoors, and it tilts.' },
        { key: 'record', label: 'Record button', text: 'Tap it. The front tally goes red.', action: 'record' },
      ],
    },
    {
      id: 'mavic', tab: 'Mavic 3 Pro', name: 'Mavic 3 Pro', line: 'DJI · triple-camera drone',
      note: 'For openers, venues and anything that needs to be seen from above. Licensed to fly commercially.',
      specs: [['Cameras', 'Hasselblad 4/3 + 70mm + 166mm'], ['Video', '5.1K 50fps · 4K 120fps'], ['Colour', '10-bit D-Log M'], ['Flight time', 'Up to 43 min'], ['Range', '15 km video link'], ['Weight', '958 g']],
      hotspots: [
        { key: 'camera', label: 'Triple camera', text: 'Three focal lengths on one gimbal: wide Hasselblad, 70mm and 166mm tele.' },
        { key: 'sensors', label: 'Obstacle sensing', text: 'Sees in every direction, so tight venue shots are less nerve-racking.' },
        { key: 'battery', label: 'Flight battery', text: 'Up to 43 minutes in the air per battery.' },
        { key: 'props', label: 'Propellers', text: 'Hit "Take off" to spin them up.', action: 'takeoff' },
      ],
    },
  ],
  // Everything else in the bag. Items with a device id open that model in the viewer.
  kit: [
    { group: 'Cameras', items: [['Lumix S5', 's5'], ['Lumix S9', 's9'], ['Blackmagic Pocket 6K Pro', 'bm6k']] },
    { group: 'Aerial', items: [['DJI Mavic 3 Pro', 'mavic'], ['ND filter set'], ['Spare batteries']] },
    { group: 'Audio', items: [['Shotgun mic'], ['Wireless lav kit'], ['Field recorder']] },
    { group: 'Light & support', items: [['LED panel'], ['Gimbal'], ['Tripod']] },
  ],
};
