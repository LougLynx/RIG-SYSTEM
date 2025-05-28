using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Manage_Receive_Issues_Goods.Controllers
{
    public class RoleController : Controller
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<IdentityUser> _userManager;

        public RoleController(RoleManager<IdentityRole> roleManager, UserManager<IdentityUser> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        public async Task<IActionResult> Create()
        {
            var roles = _roleManager.Roles.ToList();
            return View(roles);
        }

        [HttpPost]
        public async Task<IActionResult> Create(string roleName)
        {
            if (!string.IsNullOrEmpty(roleName))
            {
                var roleExist = await _roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
                    if (result.Succeeded)
                    {
                        ViewBag.Message = "Role created successfully";
                    }
                    else
                    {
                        ViewBag.Message = "Error while creating role";
                    }
                }
                else
                {
                    ViewBag.Message = "Role already exists";
                }
            }

            var roles = _roleManager.Roles.ToList();
            return View(roles);
        }

        public async Task<IActionResult> Assign()
        {
            var users = _userManager.Users.ToList();
            var roles = _roleManager.Roles.ToList();
            var userRoles = new Dictionary<string, IList<string>>();

            foreach (var user in users)
            {
                var rolesForUser = await _userManager.GetRolesAsync(user);
                userRoles[user.UserName] = rolesForUser;
            }

            ViewBag.Users = users;
            ViewBag.Roles = roles;
            ViewBag.UserRoles = userRoles;

            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Assign(string userName, string roleName)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user != null)
            {
                var roleExist = await _roleManager.RoleExistsAsync(roleName);
                if (roleExist)
                {
                    var result = await _userManager.AddToRoleAsync(user, roleName);
                    if (result.Succeeded)
                    {
                        ViewBag.Message = "Role assigned successfully";
                    }
                    else
                    {
                        ViewBag.Message = "Error while assigning role";
                    }
                }
                else
                {
                    ViewBag.Message = "Role not found";
                }
            }
            else
            {
                ViewBag.Message = "User not found";
            }

            var users = _userManager.Users.ToList();
            var roles = _roleManager.Roles.ToList();
            var userRoles = new Dictionary<string, IList<string>>();

            foreach (var usr in users)
            {
                var rolesForUser = await _userManager.GetRolesAsync(usr);
                userRoles[usr.UserName] = rolesForUser;
            }

            ViewBag.Users = users;
            ViewBag.Roles = roles;
            ViewBag.UserRoles = userRoles;

            return View();
        }

        [HttpPost]
        public async Task<IActionResult> RemoveRole(string userName, string roleName)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user != null)
            {
                var roleExist = await _roleManager.RoleExistsAsync(roleName);
                if (roleExist)
                {
                    var result = await _userManager.RemoveFromRoleAsync(user, roleName);
                    if (result.Succeeded)
                    {
                        ViewBag.Message = "Role removed successfully";
                    }
                    else
                    {
                        ViewBag.Message = "Error while removing role";
                    }
                }
                else
                {
                    ViewBag.Message = "Role not found";
                }
            }
            else
            {
                ViewBag.Message = "User not found";
            }

            var users = _userManager.Users.ToList();
            var roles = _roleManager.Roles.ToList();
            var userRoles = new Dictionary<string, IList<string>>();

            foreach (var usr in users)
            {
                var rolesForUser = await _userManager.GetRolesAsync(usr);
                userRoles[usr.UserName] = rolesForUser;
            }

            ViewBag.Users = users;
            ViewBag.Roles = roles;
            ViewBag.UserRoles = userRoles;

            return View("Assign");
        }
    }
}
