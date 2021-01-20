const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiString = require('chai-string');
const server = require("../app.js");
const expect = chai.expect;
const fs = require('fs');
require('dotenv').config()

chai.use(chaiHttp).use(chaiString);

const validToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc4M2VjMDMxYzU5ZTExZjI1N2QwZWMxNTcxNGVmNjA3Y2U2YTJhNmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDYyNTU3NTA4MDg2LTQ0ajQwdnU3ZzBkZzM0cGkzMmFlNmtxM2Fyam02bzFqLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2MjU1NzUwODA4Ni00NGo0MHZ1N2cwZGczNHBpMzJhZTZrcTNhcmptNm8xai5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNjI3MTAzMjcyNzUyNTEwNDAwNCIsImhkIjoibWlhbWlvaC5lZHUiLCJlbWFpbCI6InBoYW5oQG1pYW1pb2guZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ5RnBpcmlQQlM4ZWJKVVByN0twR1J3Iiwibm9uY2UiOiI2VXg4VFNMMVpnMTRtdWFWTWRMRXpYbm4xbDM4cmYiLCJuYW1lIjoiSGlldSBQaGFuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS8tdGotOWVZMDlUeUEvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQU1adXVjbG5jbVliZjJtV1VyMUxqM3M0blFwOTg4anB3QS9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiSGlldSIsImZhbWlseV9uYW1lIjoiUGhhbiIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjExMTE0NzMzLCJleHAiOjE2MTExMTgzMzMsImp0aSI6ImY2MWE4NWQzNDNhMzgxZDQyOWE5Y2FiNjEwMGM0NDUwZjE1NzliZTIifQ.BrzJUpHzxA9gFrNQiZwgnaEw1vGWzGZM_E3ok3qBBJkrOhGBzzF8QtC_upbF12FUAs0b11S_6PWTsDTjsm4Wi7DkbmO0iS4eBBQiLHbdCJfoPgNos4nGCRgAoaQbyX4xJypWmVomluuzUm8OxcyGLWAHPAx3IkO5ueLguMaxNfZXbVTjMt_qC115xLNgMJV9SHFK50uNESN0r2wxSgU3uZAFCBoy-NJtHpXH7QQr5wb8SCuPq8j6ZG975IkaKhKZdTVXTTuQoFXxbhLOescVPZpehnldeXyzRkg5BvLFaGkpOyz3D8qO1F9LM7lxTRs3si0SuJ9tFKzYdLHrQUiawQ"
const invalidToken = "abcd"

describe("App", () => {
    after(() => {
      server.close();
    });

    // test /api/home route
    it("should get home", done => {
      chai
        .request(server)
        .get("/api/home")
        .set('X-Authentication', validToken)
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
    it("should get signin successfully with valid token", done => {
      chai
        .request(server)
        .get("/api/signin")
        .set('X-Authentication', validToken)
        .query({token: validToken})
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).equal("Success");
          done();
        });
    });

    // test /api/image route
    it("should post image", done => {
      chai
        .request(server)
        .post("/api/image")
        .set('X-Authentication', validToken)
        .attach('image', fs.readFileSync('./test-image.jpg'), 'test-image.jpg')
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
        .set('X-Authentication', validToken)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.text).equal("Error");
          done();
        });
    });
  });