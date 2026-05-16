export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl: string;
  nationality: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  acronym: string;
  imageUrl: string;
  players: Player[];
}
