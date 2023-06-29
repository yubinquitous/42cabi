package org.ftclub.cabinet.lent.domain;

import static javax.persistence.FetchType.LAZY;

import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.ftclub.cabinet.cabinet.domain.Cabinet;
import org.ftclub.cabinet.exception.DomainException;
import org.ftclub.cabinet.exception.ExceptionStatus;
import org.ftclub.cabinet.user.domain.User;
import org.ftclub.cabinet.utils.DateUtil;
import org.ftclub.cabinet.utils.ExceptionUtil;

/**
 * lent의 기록을 관리하기 위한 data mapper
 */
@Entity
@Table(name = "LENT_HISTORY")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@ToString
public class LentHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "LENT_HISTORY_ID")
	private Long lentHistoryId;

	/**
	 * 낙관적 락을 위한 version
	 */
	@Version
	@Getter(AccessLevel.NONE)
	private Long version = 1L;

	/**
	 * 대여 시작일
	 */
	@Temporal(value = TemporalType.TIMESTAMP)
	@Column(name = "STARTED_AT", nullable = false)
	private Date startedAt;

	/**
	 * 연체 시작일
	 */
	@Temporal(value = TemporalType.TIMESTAMP)
	@Column(name = "EXPIRED_AT")
	private Date expiredAt = null;

	/**
	 * 반납일
	 */
	@Temporal(value = TemporalType.TIMESTAMP)
	@Column(name = "ENDED_AT")
	private Date endedAt = null;

	/**
	 * 대여하는 유저
	 */
	@Column(name = "USER_ID", nullable = false)
	private Long userId;

	/**
	 * 대여하는 캐비넷
	 */
	@Column(name = "CABINET_ID", nullable = false)
	private Long cabinetId;

	@JoinColumn(name = "USER_ID", insertable = false, updatable = false)
	@ManyToOne(fetch = LAZY)
	private User user;

	@JoinColumn(name = "CABINET_ID", insertable = false, updatable = false)
	@ManyToOne(fetch = LAZY)
	private Cabinet cabinet;

	protected LentHistory(Date startedAt, Date expiredAt, Long userId,
			Long cabinetId) {
		this.startedAt = startedAt;
		this.expiredAt = expiredAt;
		this.userId = userId;
		this.cabinetId = cabinetId;
	}

	/**
	 * @param startedAt 대여 시작일
	 * @param expiredAt 연체 시작일
	 * @param userId    대여하는 user id
	 * @param cabinetId 대여하는 cabinet id
	 * @return 인자 정보를 담고있는 {@link LentHistory}
	 */
	public static LentHistory of(Date startedAt, Date expiredAt, Long userId, Long cabinetId) {
		LentHistory lentHistory = new LentHistory(startedAt, expiredAt, userId, cabinetId);
		if (!lentHistory.isValid()) {
			throw new DomainException(ExceptionStatus.INVALID_ARGUMENT);
		}
		return lentHistory;
	}

	/**
	 * startedAt, userId, cabinetId, expiredAt 의 null 이 아닌지 확인합니다.
	 *
	 * @return 유효한 인스턴스 여부
	 */

	private boolean isValid() {
		return this.startedAt != null && this.userId != null && this.cabinetId != null
				&& this.expiredAt != null;
	}

	/**
	 * endedAt 보다 startedAt 이 나중이 아닌지 확인합니다. endedAt 종료시점이 null 이 아닌지 확인합니다.
	 *
	 * @param endedAt 대여 종료 날짜, 시간
	 * @return
	 */
	private boolean isEndLentValid(Date endedAt) {
		return endedAt != null && this.endedAt == null && 0 <= DateUtil.calculateTwoDateDiff(
				endedAt, this.startedAt);
	}


	@Override
	public boolean equals(final Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof LentHistory)) {
			return false;
		}
		return (this.lentHistoryId.equals(((LentHistory) other).lentHistoryId));
	}

	/**
	 * 대여한 아이디와 같은지 비교한다.
	 *
	 * @param cabinetId 비교하고 싶은 id
	 * @return boolean 같으면 true 다르면 false
	 */
	public boolean isCabinetIdEqual(Long cabinetId) {
		return this.cabinetId.equals(cabinetId);
	}

	/**
	 * 만료일을 변경합니다.
	 *
	 * @param expiredAt 변경하고 싶은 만료일
	 */
	public void setExpiredAt(Date expiredAt) {
		this.expiredAt = expiredAt;
		ExceptionUtil.throwIfFalse(this.isValid(),
				new DomainException(ExceptionStatus.INVALID_STATUS));
	}

	/**
	 * 만료일이 설정 되어있는 지 확인합니다. 만료일이 {@link DateUtil}의 infinityDate와 같으면 만료일이 설정되어 있지 않다고 판단합니다.
	 *
	 * @return 설정이 되어있으면 true 아니면 false
	 */
	public boolean isSetExpiredAt() {
		return (getExpiredAt() != null && getExpiredAt() != DateUtil.getInfinityDate());
	}

	/**
	 * 반납일이 설정 되어있는 지 확인합니다. 반납일이 {@link DateUtil}의 infinityDate와 같으면 만료일이 설정되어 있지 않다고 판단합니다.
	 *
	 * @return 설정이 되어있으면 ture 아니면 false
	 */
	public boolean isSetEndedAt() {
		return (getEndedAt() != null && getEndedAt() != DateUtil.getInfinityDate());
	}


	/**
	 * 반납일과 만료일의 차이를 계산합니다.
	 *
	 * @return endedAt - expiredAt의 값을(일 기준)
	 */
	public Long getDaysDiffEndedAndExpired() {
		if (isSetExpiredAt() && isSetEndedAt()) {
			return DateUtil.calculateTwoDateDiff(endedAt, expiredAt);
		}
		return null;
	}


	/**
	 * 반납일을 설정합니다.
	 *
	 * @param now 설정하려고 하는 반납일
	 */
	public void endLent(Date now) {
		ExceptionUtil.throwIfFalse((this.isEndLentValid(now)),
				new DomainException(ExceptionStatus.INVALID_ARGUMENT));
		this.endedAt = now;
		ExceptionUtil.throwIfFalse((this.isValid()),
				new DomainException(ExceptionStatus.INVALID_STATUS));
	}
}