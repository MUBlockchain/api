const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiString = require('chai-string');
const { server } = require("../app");
const expect = chai.expect;
const {readFileSync} = require('fs');
require('dotenv').config()

chai.use(chaiHttp).use(chaiString);

const validTokenMiami = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MmZjYjk3ZGY1YjZiNGY2ZDFhODg1ZjFlNjNkYzRhOWNkMjMwYzUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDYyNTU3NTA4MDg2LTQ0ajQwdnU3ZzBkZzM0cGkzMmFlNmtxM2Fyam02bzFqLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2MjU1NzUwODA4Ni00NGo0MHZ1N2cwZGczNHBpMzJhZTZrcTNhcmptNm8xai5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNjI3MTAzMjcyNzUyNTEwNDAwNCIsImhkIjoibWlhbWlvaC5lZHUiLCJlbWFpbCI6InBoYW5oQG1pYW1pb2guZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ0TVptZ2RCLW5LX2xDZW1sTlc5S1BnIiwibm9uY2UiOiJGVHNaUkpvb3hkWkJEUnFqYXJJZUp0MmxRSkVYNzMiLCJuYW1lIjoiSGlldSBQaGFuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS8tdGotOWVZMDlUeUEvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQU1adXVjbG5jbVliZjJtV1VyMUxqM3M0blFwOTg4anB3QS9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiSGlldSIsImZhbWlseV9uYW1lIjoiUGhhbiIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjEwMjM2NTYxLCJleHAiOjE2MTAyNDAxNjEsImp0aSI6IjZjNTM3ZjcxYmIwNzdlZmFhNmNjMjFiZTZjNzUxMzFiN2YzYmQyNDMifQ.rxDzf-FhOCbyKzXYVsJFNBQvINBJR5RwZ5mtmBA-40Iq2KPff6jT7p01C8VJjXsrNVwARge_5CYNDwIpSRh6fCohkosYIOPYZ1YXxOtZioyhqPjcex5qRF6TeaQBAGtQ5A-ONrfRwmnRSVVo-zz2Ewc6crbEhT6ADDXIg8GN_a9Asb9CvuraLFwJJ3lRJRVLAYBj5dFjTHzBfnygzAp7eU0tF00RVRkckSOrDmLXM252l6mTwZrH4gTpTDc2OwtZmQhZ2Jtoj6ooglWsMgjK7ngM2LQGm4SFENpxXUZ9i_gFsa8IHT1N2YD7ztw0SeS3ez2qVhUtuKqmr1fpRBqTtw"
const invalidToken = "abcd"
const validTokenNonMiami = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI1MmZjYjk3ZGY1YjZiNGY2ZDFhODg1ZjFlNjNkYzRhOWNkMjMwYzUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDYyNTU3NTA4MDg2LTQ0ajQwdnU3ZzBkZzM0cGkzMmFlNmtxM2Fyam02bzFqLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2MjU1NzUwODA4Ni00NGo0MHZ1N2cwZGczNHBpMzJhZTZrcTNhcmptNm8xai5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNTg0NzM4NjI1MjAwOTI5NTg3NyIsImVtYWlsIjoicGhhbnRydW5naGlldTA1MTBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJqRXUyVlZJTnN2OW9qQ09kX3ptLVpRIiwibm9uY2UiOiJBU1JLZ0RFQ2xYMmRFSGV0dzA4cVlkelhJRHRkdmwiLCJuYW1lIjoiSGnhur91IFBoYW4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2dHUXd4REtuU005OUZTMXZvd3pNanNMbV9fNFQxd09qcGtvTWc9czk2LWMiLCJnaXZlbl9uYW1lIjoiSGnhur91IiwiZmFtaWx5X25hbWUiOiJQaGFuIiwibG9jYWxlIjoidmkiLCJpYXQiOjE2MTAyMzY3MDUsImV4cCI6MTYxMDI0MDMwNSwianRpIjoiMmFjY2NiMmZkZmRlMWRkNmI5ODE1MTZjNzcyYThkOTg0NGE3NjBkMCJ9.kkCkm6y8Ga9rtNu7UYlPco9apOwSMqjFJoogOfS6nfLx-RBGW4ygm9iGS3ZJaIuZ1ko5yKMc0e16yKXPqPdbtrbWq3xTgkGEaEnOeOjgYb2ILs3bFUhWTNU60Dh8lOnt3rLp5xghIggu9j60m_NSUOKR3l74SOD52e1kgu40GgnK5arzUdGGAZ1Hb4GXNZg-3Nw32TE2pLNj8FbqtF0QaDR6bmxcrFDSuLqf0IvsQMPLd_j1Slf93bbpMsW8M3UvMPNyu642CK3cTrlp4Q0tMcXAPSHsVZ86pekZ_Jt8xVNXbIW7T7JU-kY0aY7S040c2tlgQUIVEEIhOj3Bkpryog"

describe("App", () => {
    after(() => {
      server.close();
    });

    // test /api/home route
    it("should get home", done => {
      chai
        .request(server)
        .get("/api/home")
        .set('X-Authentication', validTokenMiami)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).equal("Hello World");
          done();
        });
    });

    // test auth function
    it("should not get home due to invalid token", done => {
      chai
        .request(server)
        .get("/api/home")
        .set('X-Authentication', invalidToken)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    // test /api/signin route
    it("should get signin successfully with Miami account token", done => {
      chai
        .request(server)
        .get("/api/signin")
        .set('X-Authentication', validTokenMiami)
        .query({token: validTokenMiami})
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).equal("Success");
          done();
        });
    });

    it("should not get signin successfully with non-Miami account token", done => {
      chai
        .request(server)
        .get("/api/signin")
        .set('X-Authentication', validTokenNonMiami)
        .query({token: validTokenNonMiami})
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    // test /api/image route
    it("should post image", done => {
      chai
        .request(server)
        .post("/api/image")
        .attach('image', readFileSync('./website.jpg'), 'website.jpg')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.have.string(
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`
          );
          done();
        });
    });

    it("should reject null upload", done => {
      chai
        .request(server)
        .post("/api/image")
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.text).equal("Error");
          done();
        });
    });
  });