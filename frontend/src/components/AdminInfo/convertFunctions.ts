import { BannedUserDto, BrokenCabinetDto } from "@/types/dto/admin.dto";

interface IData {
  first?: string;
  second?: string;
  third?: string;
}

const calcLeftDays = (start: Date, end: Date) =>
  Math.ceil((end.getTime() - start.getTime()) / 1000 / 3600 / 24);

const convertDate = (date: Date): string =>
  `~ ${date.getFullYear() % 100}.${
    date.getMonth() >= 9 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)
  }.${date.getDay() < 10 ? "0" + date.getDay() : date.getDay()}`;

export const handleBannedUserList = (data: BannedUserDto[]): IData[] =>
  data
    .map(({ intra_id, banned_date, unbanned_date }) => ({
      first: intra_id,
      second: calcLeftDays(
        new Date(banned_date),
        new Date(unbanned_date)
      ).toString(),
      third: convertDate(new Date(unbanned_date)),
    }))
    .sort(
      (personA, personB) => Number(personB.second) - Number(personA.second)
    );

export const handleBrokenCabinetList = (data: BrokenCabinetDto[]): IData[] =>
  data.map(({ floor, cabinet_num, section, note }) => ({
    first: `${floor}F-${cabinet_num}`,
    second: section,
    third: note || "",
  }));