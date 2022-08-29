import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBanRepository } from './ban.repository';
import * as mariadb from 'mariadb';
import { overUserInfoDto } from '../dto/overUserInfo.dto';
import { banUserAddInfoDto } from '../dto/banUserAddInfo.dto';

export class RawqueryBanRepository implements IBanRepository {
  private con;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.con = mariadb.createPool({
      host: this.configService.get<string>('database.host'),
      user: this.configService.get<string>('database.user'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
    });
  }

  /**
   * n일 이상 연체자 조회
   * @param days 연체일
   * @return userInfoDto 리스트 or undefined
   */
  async getOverUser(days: number): Promise<overUserInfoDto[] | undefined> {
    const pool: mariadb.PoolConnection = await this.con.getConnection();
    let overUserList: overUserInfoDto[] | undefined = [];
    const content = `
		SELECT  u.*, l.lent_id, l.lent_cabinet_id
		FROM user u RIGHT OUTER JOIN lent l ON u.user_id = l.lent_user_id
		WHERE DATEDIFF(now(), expire_time) = ${days}`;

    await pool
      .query(content)
      .then((res: any) => {
        if (!res.length) overUserList = undefined;
        else {
          res.forEach((user: any) => {
            overUserList?.push({
              user_id: user.user_id,
              intra_id: user.intra_id,
              auth: user.auth,
              email: user.email,
              lent_id: user.lent_id,
              cabinet_id: user.lent_cabinet_id,
            });
          });
        }
      })
      .catch((err) => {
        throw new Error('getOverUser Error');
      });
    if (pool) pool.end();
    return overUserList;
  }

  /**
   * 유저 권한 ban(1) 으로 변경
   * @param userId 유저 PK
   */
  async updateUserAuth(userId: number): Promise<void> {
    const pool: mariadb.PoolConnection = await this.con.getConnection();
    const content = `
		UPDATE user SET auth = 1 WHERE user_id = ${userId};
		`;

    await pool.query(content).catch((err: any) => {
      throw new Error('updateUserAuth Error');
    });
  }

  /**
   * 캐비넷 activation 변경
   * @param cabinetId 캐비넷 PK
   * @param activation 캐비넷 상태 값
   */
  async updateCabinetActivation(
    cabinetId: number,
    activation: number,
  ): Promise<void> {
    const pool: mariadb.PoolConnection = await this.con.getConnection();
    const content = `
			UPDATE cabinet SET activation = ${activation} WHERE cabinet_id = ${cabinetId}
		`;

    await pool.query(content).catch((err: any) => {
      throw new Error('updateCabinetActivation Error');
    });
    if (pool) pool.end();
  }

  /**
   * banUser 추가
   * @param banUser 추가될 유저 정보
   */
  async addBanUser(banUser: banUserAddInfoDto) {
    const pool: mariadb.PoolConnection = await this.con.getConnection();
    const cabinet_id = banUser.cabinet_id ? banUser.cabinet_id : 'NULL';
    const content = `
		INSERT INTO ban_user(user_id, intra_id, cabinet_id, bannedDate)
		values (${banUser.user_id}, '${banUser.intra_id}', ${cabinet_id}, now());
		`;

    await pool.query(content).catch((err: any) => {
      throw new Error('CheckBanUser Error');
    });
    if (pool) pool.end();
  }

  /**
   * 해당 유저가 Ban처리 되어있는지 확인
   * @param user_id 추가될 유저의 id
   */
  async checkBannedUserList(user_id: number) {
    const pool: mariadb.PoolConnection = await this.con.getConnection();
    const content = `SELECT * FROM user WHERE user_id=${user_id}`;
    let isBanned = 0;

    await pool
      .query(content)
      .then((res: any) => {
        isBanned = res[0].auth;
      })
      .catch((err: any) => {
        throw err;
      });
    if (pool) pool.end();
    return isBanned;
  }
}