export const FLOORS = Object.freeze([
  Object.freeze({
    id: '1',
    label: 'Floor 1',
    rooms: 'Living / Dining / Kitchen',
    summary: 'A connected social level organized around the living room, dining area, kitchen, and vertical circulation.',
    video: './static/videos/1.mp4',
    tourVideo: './static/videos/m1.mp4',
  }),
  Object.freeze({
    id: '2',
    label: 'Floor 2',
    rooms: 'Office / Meeting / Bedroom',
    summary: 'A work-and-rest level combining an office, a meeting room, a bedroom, and direct balcony access.',
    video: './static/videos/2.mp4',
    tourVideo: './static/videos/m2.mp4',
  }),
  Object.freeze({
    id: '3',
    label: 'Floor 3',
    rooms: 'Children / Bath / Balcony',
    summary: 'A private upper level with a children room, bathroom, utility space, and connected balcony.',
    video: './static/videos/3.mp4',
    tourVideo: './static/videos/m3.mp4',
  }),
]);

export function getFloorById(id) {
  const normalizedId = String(id ?? '');
  return FLOORS.find((floor) => floor.id === normalizedId) ?? FLOORS[0];
}

export function createFloorState(id) {
  const floor = getFloorById(id);

  return {
    floor,
    title: `${floor.label} Preview`,
    buttons: FLOORS.slice().reverse().map((item) => ({
      id: item.id,
      label: item.label,
      pressed: item.id === floor.id,
    })),
  };
}
