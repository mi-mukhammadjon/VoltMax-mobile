import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Main: undefined;
  Stations: undefined;
  Charging: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Map: undefined;
  Search: undefined;
  Notifications: undefined;
  Otp: { phone: string };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  StationDetail: { stationId: string };
  ChargingSession: { sessionId: string };
  Wallet: undefined;
  History: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  AboutApp: undefined;
  MyVehicles: undefined;
  MyRfidCards: undefined;
  MyBookings: undefined;
  NewBooking: { stationId: string };
};
