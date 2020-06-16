import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { layout } from "../view/layout.js";
import { Provider } from "react-redux";
import bcrypt from "bcryptjs";
import passport from "koa-passport";
import configureStore from "../../client/src/redux/store/configureStore";
import App from "../../client/src/view/containers/login/index.js";

import db from "../config/db.js";
const User = db.User;

// get page and switch json and html
export function index(ctx) {
  if (ctx.isAuthenticated()) {
    ctx.redirect("/");
  }
  switch (ctx.accepts("json", "html")) {
    case "html":
      {
        //init store
        let loginStore = {
          user: {
            logined: ctx.isAuthenticated()
          }
        };
        const store = configureStore(loginStore);
        const html = layout(
          renderToString(
            <Provider store={store}>
              <StaticRouter location={ctx.url} context={{}}>
                <App />
              </StaticRouter>
            </Provider>
          ),
          store.getState()
        );
        ctx.body = html;
      }
      break;
    case "json":
      {
        let callBackData = {
          status: 200,
          message: "这个是登录页",
          data: {}
        };
        ctx.body = callBackData;
      }
      break;
    default: {
      // allow json and html only
      ctx.throw(406, "allow json and html only");
      return;
    }
  }
}

// user login
export async function login(ctx) {
  if (ctx.accepts("json", "html") == "json") {
    let data = ctx.request.body;
    //If reg data is null,reback some tips
    if (!data.username || !data.password) {
      let callBackData = {
        success: false,
        status: 200,
        message: "请输入您的账号或邮箱和密码!",
        data: {}
      };
      ctx.body = callBackData;
    } else {
      await User.findOne({
        attributes: ["id", "username", "password"],
        where: {
          $or: [
            {
              username: data.username
            },
            {
              email: data.username
            }
          ]
        }
      }).then(
        async user => {
          if (user) {
            let isMatch = bcrypt.compareSync(data.password, user.password);
            if (isMatch) {
              await passport.authenticate("local", function(err, user) {
                let callBackData = {
                  success: true,
                  status: 200,
                  message: "登录成功!",
                  data: {}
                };
                ctx.body = callBackData;
                return ctx.login(user);
              })(ctx);
            } else {
              let callBackData = {
                success: false,
                status: 200,
                message: "请输入您的账号或邮箱和密码错误!",
                data: {}
              };
              ctx.body = callBackData;
            }
          } else {
            let callBackData = {
              success: false,
              status: 200,
              message: "用户名或邮箱不存在!",
              data: {}
            };
            ctx.body = callBackData;
          }
        },
        function() {
          let callBackData = {
            success: false,
            status: 200,
            message: "登录失败!",
            data: {}
          };
          ctx.body = callBackData;
        }
      );
    }
  }
}

// user logout
export function logout(ctx) {
  ctx.logout();
  switch (ctx.accepts("json", "html")) {
    case "html":
      {
        let callBackData = {
          success: true,
          status: 200,
          message: "登出成功!",
          data: {}
        };
        ctx.body = callBackData;
        ctx.redirect("/");
      }
      break;
    case "json":
      {
        let callBackData = {
          success: true,
          status: 200,
          message: "登出成功!",
          data: {}
        };
        ctx.body = callBackData;
      }
      break;
    default: {
      // allow json and html only
      ctx.throw(406, "allow json and html only");
      return;
    }
  }
}
