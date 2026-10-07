// Gear shown in the interactive drawings and the kit list.
// Placeholders: swap in your real models, notes and specs.
//   scene — which drawing the part lives on ('rig' or 'drone')
//   at    — hotspot position on that drawing, in drawing units (1000 × 600)
//   model — the exact make/model, shown in italics
window.GEAR = {
  scenes: [
    { id: 'rig', label: 'Camera rig' },
    { id: 'drone', label: 'Drone' },
  ],
  parts: [
    { id: 'body', scene: 'rig', at: [512, 352], name: 'Camera body', model: 'Your camera model',
      note: 'The workhorse. Shoots everything from Friday-night hype edits to sit-down interviews.',
      specs: [['Sensor', 'Full frame'], ['Records', '4K up to 120fps'], ['Colour', '10-bit log']] },
    { id: 'lens', scene: 'rig', at: [234, 330], name: 'Lens', model: 'Your main lens',
      note: 'A fast zoom that covers wide establishing shots and tight sideline reactions without a swap.',
      specs: [['Focal length', '24–70mm'], ['Aperture', 'f/2.8'], ['Mount', 'Native']] },
    { id: 'monitor', scene: 'rig', at: [269, 139], name: 'Field monitor', model: 'Your monitor',
      note: 'Bigger, brighter picture for nailing focus and exposure in daylight.',
      specs: [['Screen', '5–7 inch'], ['Brightness', 'Daylight viewable'], ['Tools', 'Waveform, peaking, LUTs']] },
    { id: 'mic', scene: 'rig', at: [604, 112], name: 'Shotgun mic', model: 'Your on-camera mic',
      note: 'Clean scratch and ambient audio straight into the camera.',
      specs: [['Pattern', 'Super-cardioid'], ['Mount', 'Cold shoe'], ['Power', 'Battery / plug-in']] },
    { id: 'handle', scene: 'rig', at: [596, 188], name: 'Cage & top handle', model: 'Your cage',
      note: 'Low-angle handheld runs and quick grabs between plays.',
      specs: [['Mounting', '1/4" and 3/8" points'], ['Handle', 'Quick release']] },
    { id: 'battery', scene: 'rig', at: [730, 336], name: 'Power', model: 'Your batteries',
      note: 'Enough power for a full game or event without a swap.',
      specs: [['Runtime', 'All day with spares'], ['Plate', 'V-mount / NP-F']] },
    { id: 'focus', scene: 'rig', at: [230, 448], name: 'Follow focus', model: 'Your follow focus',
      note: 'Smooth, repeatable focus pulls for docs and slow-mo.',
      specs: [['Drive', 'Manual / wireless'], ['Rods', '15mm']] },
    { id: 'drone-body', scene: 'drone', at: [566, 356], name: 'Drone', model: 'Your drone model',
      note: 'Aerials for venues, coastlines and opening shots. Licensed to fly commercially.',
      specs: [['Video', '4K up to 60fps'], ['Wind resistance', 'Level 5'], ['Licence', 'Part 107 (placeholder)']] },
    { id: 'drone-camera', scene: 'drone', at: [500, 214], name: 'Gimbal camera', model: 'Your drone camera',
      note: '3-axis stabilised for glassy reveals and top-down shots.',
      specs: [['Gimbal', '3-axis'], ['Colour', '10-bit log']] },
    { id: 'drone-props', scene: 'drone', at: [300, 135], name: 'Propellers', model: 'Low-noise props',
      note: 'Quieter props for events and interviews where noise matters.',
      specs: [['Type', 'Quick release'], ['Spares', 'Always packed']] },
    { id: 'drone-battery', scene: 'drone', at: [500, 301], name: 'Flight batteries', model: 'Your drone batteries',
      note: 'Several batteries so a whole golden hour can be covered.',
      specs: [['Flight time', '~30 min each'], ['Charging', 'Hub + car charger']] },
  ],
  // Everything else in the bag. Items with a part id light up that part on the drawing when hovered.
  kit: [
    { group: 'Camera', items: [['Camera body', 'body'], ['Main lens', 'lens'], ['Field monitor', 'monitor'], ['Follow focus', 'focus'], ['Cage & handle', 'handle']] },
    { group: 'Aerial', items: [['Drone', 'drone-body'], ['Gimbal camera', 'drone-camera'], ['Flight batteries', 'drone-battery'], ['ND filter set']] },
    { group: 'Audio', items: [['Shotgun mic', 'mic'], ['Wireless lav kit'], ['Field recorder']] },
    { group: 'Light & support', items: [['LED panel'], ['Tube lights'], ['Gimbal'], ['Tripod'], ['Power', 'battery']] },
  ],
};
