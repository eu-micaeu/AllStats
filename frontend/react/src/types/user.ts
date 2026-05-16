export interface TeamSimple {
  id: string;
  name: string;
  logo: string;
  game: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  favoriteTeams?: TeamSimple[];
}
