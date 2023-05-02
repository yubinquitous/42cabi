package org.ftclub.cabinet.auth;

import io.jsonwebtoken.Jwts;
import javax.servlet.http.HttpServletRequest;
import javax.xml.bind.DatatypeConverter;
import lombok.RequiredArgsConstructor;
import org.ftclub.cabinet.config.JwtProperties;
import org.ftclub.cabinet.exception.ExceptionStatus;
import org.ftclub.cabinet.exception.ServiceException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TokenValidator {

    private final JwtProperties jwtProperties;

    private final CookieManager cookieManager;

    public Boolean isTokenValid(HttpServletRequest req, String tokenName) {
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null
                || authHeader.startsWith("Bearer ") == false) {
            return false;
        }
        String token = authHeader.substring(7);
        if (token == null || checkTokenValidity(token) == true) {
            return false;
        }
        return true;
    }

    public Boolean checkTokenValidity(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(DatatypeConverter.parseBase64Binary(jwtProperties.getSecret()))
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration()
                    .before(new java.util.Date());
        } catch (Exception e) {
            throw new ServiceException(ExceptionStatus.UNAUTHORIZED);
        }
    }
}
